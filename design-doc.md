# Technical Design Document: IMAP MCP Server

| Field | Value |
|-------|-------|
| Version | 0.1.0 |
| Date | 2026-08-27 |
| Status | Draft |
| Author | geebo |
| NPM Package | `@gfam/imap-server` |

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MCP Client (LLM)                        │
│              Claude Desktop / CLI / IDE                     │
└───────────────┬───────────────────────────────┬─────────────┘
                │ stdio transport               │ Streamable HTTP
                │                               │
┌───────────────▼───────────────────────────────▼─────────────┐
│              IMAP MCP Server (Node.js)                      │
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐    │
│  │ MCP Tools    │ │ MCP Resources│ │ MCP Prompts      │    │
│  │ (12 IMAP)    │ │ (email body, │ │ (search templates│    │
│  │ (5 SMTP)     │ │  headers)    │ │  email templates)│    │
│  └──────┬───────┘ └──────┬───────┘ └────────┬─────────┘    │
│         │                │                   │             │
│  ┌──────▼───────────────▼───────────────────▼─────────┐   │
│  │           Connection Pool Manager                   │   │
│  │  - Lazy init, keep-alive, auto-reconnect            │   │
│  │  - Per-connection IMAP + SMTP sessions              │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                    │
│  ┌─────────────────────▼────────────────────────────────┐   │
│  │           IMAP/SMTP Service Layer                     │   │
│  │  - imapflow (IMAP operations)                         │   │
│  │  - nodemailer (SMTP operations)                       │   │
│  │  - mailparser (MIME parsing)                          │   │
│  │  - zod (input/output schema validation)               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                │                              │
┌───────────────▼──────────────────────────────▼─────────────┐
│                    External Services                        │
│              IMAP Server (port 993) + SMTP Server           │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Core Components

| Component | Responsibility | Library |
|-----------|---------------|---------|
| MCP Server | Transport, tool/resource/prompt registration | `@modelcontextprotocol/server` v2 |
| IMAP Client | Connection, authentication, mailbox ops | `imapflow` v1.7 |
| SMTP Client | Send, draft management | `nodemailer` v9 |
| MIME Parser | Raw email body extraction | `mailparser` v3.9 |
| Schema Validator | Input/output validation | `zod` v4 |
| Env Loader | Credential management | `dotenv` v17 |

### 1.3 Transport Modes

| Mode | Use Case | Configuration |
|------|----------|---------------|
| stdio | Claude Desktop, CLI tools, local agents | Default, no config needed |
| Streamable HTTP | Remote LLM clients, web dashboards | Set `MCP_TRANSPORT=http`, `HTTP_PORT=3000` |

---

## 2. Directory Structure

```
@gfam/imap-server/
├── package.json              # NPM manifest, bin entry, scripts
├── tsconfig.json             # TypeScript config (ESM, strict)
├── .env.example              # Credential template
├── README.md                 # Usage docs, config reference
│
├── src/
│   ├── index.ts              # Single entry point — creates MCP server, wires tools
│   ├── config.ts             # Config loader (env vars, .env, CLI args)
│   ├── connection.ts         # Connection pool manager (IMAP + SMTP)
│   ├── imap/
│   │   ├── index.ts          # IMAP tool registrations
│   │   ├── list-folders.ts   # list_folders tool
│   │   ├── search-emails.ts  # search_emails tool
│   │   ├── fetch-email.ts    # fetch_email tool
│   │   ├── email-body.ts     # get_email_body tool
│   │   ├── email-headers.ts  # get_email_headers tool
│   │   ├── attachments.ts    # list_attachments, download_attachment
│   │   ├── flags.ts          # mark_as_read tool
│   │   ├── move-email.ts     # move_email tool
│   │   ├── delete-email.ts   # delete_email tool
│   │   ├── create-folder.ts  # create_folder tool
│   │   └── list-unread.ts    # list_unread tool
│   ├── smtp/
│   │   ├── index.ts          # SMTP tool registrations
│   │   ├── send-email.ts     # send_email tool
│   │   ├── send-with-attach.ts # send_email_with_attachment tool
│   │   ├── drafts.ts         # list_drafts, save_as_draft, delete_draft
│   │   └── send-with-inline.ts # send_email_with_inline_image (bonus)
│   ├── resources/
│   │   ├── email-body.ts     # Resource template for email body
│   │   └── email-headers.ts  # Resource template for headers
│   ├── prompts/
│   │   ├── search-template.ts # Prompt: "Help me search emails"
│   │   ├── compose-template.ts # Prompt: "Draft a reply"
│   │   └── folder-organize.ts # Prompt: "Organize my inbox"
│   └── schema.ts             # Shared Zod schemas (request/response types)
│
├── tests/
│   ├── imap.test.ts          # IMAP tool tests (mocked imapflow)
│   ├── smtp.test.ts          # SMTP tool tests (mocked nodemailer)
│   └── connection.test.ts    # Connection pool tests
│
└── dist/                     # Compiled output (gitignored)
```

---

## 3. API Surface

### 3.1 IMAP Tools

All tools accept a `credentials` object (injected from config) and return structured results validated against Zod schemas.

#### 3.1.1 list_folders

```
Tool: list_folders
Description: List all IMAP mailboxes/folders in the account
Params:
  - folder_pattern?: string    # IMAP wildcard pattern, default "*"
  - include_subfolders: boolean # true for recursive listing
Returns: { folders: [{ name: string, delimiter: string, flags: string[] }] }
```

#### 3.1.2 search_emails

```
Tool: search_emails
Description: Search emails by criteria, returning paginated results
Params:
  - folder?: string            # IMAP folder, default "INBOX"
  - from?: string              # Sender address filter
  - to?: string                # Recipient address filter
  - subject?: string           # Subject substring match
  - date_from?: string         # ISO 8601 date, e.g. "2026-08-01"
  - date_to?: string           # ISO 8601 date
  - keyword?: string           # General body/keyword search
  - unread_only?: boolean      # Only unread messages
  - limit?: number             # Max results, default 50
  - offset?: number            # Pagination offset, default 0
Returns: {
  total: number,
  results: [{ uid: number, subject: string, from: string, date: string, message_id: string, snippet: string }]
}
```

#### 3.1.3 fetch_email

```
Tool: fetch_email
Description: Fetch full email content including headers, body, and attachments
Params:
  - uid: number                # Message UID in the folder
  - folder?: string            # IMAP folder, default "INBOX"
  - include_body: boolean      # Include parsed body, default true
  - include_attachments: boolean # Include attachment data, default false
Returns: {
  uid: number,
  subject: string,
  from: { address: string, name: string },
  to: [{ address: string, name: string }],
  cc?: [{ address: string, name: string }],
  date: string,
  message_id: string,
  body_text?: string,
  body_html?: string,
  attachments?: [{ name: string, size: number, content_type: string, content_base64?: string }]
}
```

#### 3.1.4 get_email_body

```
Tool: get_email_body
Description: Fetch only the body (text and/or HTML) of an email — fast, no headers/attachments
Params:
  - uid: number                # Message UID
  - folder?: string            # IMAP folder
  - text_only?: boolean        # If true, return only plain text
Returns: { body_text?: string, body_html?: string }
```

#### 3.1.5 get_email_headers

```
Tool: get_email_headers
Description: Fetch only email headers — minimal bandwidth, no body download
Params:
  - uid: number                # Message UID
  - folder?: string            # IMAP folder
Returns: {
  subject: string,
  from: string,
  to: string,
  cc?: string,
  date: string,
  message_id: string,
  in_reply_to?: string,
  headers: Record<string, string>
}
```

#### 3.1.6 list_attachments

```
Tool: list_attachments
Description: List attachment names and metadata for a given message
Params:
  - uid: number                # Message UID
  - folder?: string            # IMAP folder
Returns: { attachments: [{ name: string, size: number, content_type: string, id: string }] }
```

#### 3.1.7 download_attachment

```
Tool: download_attachment
Description: Download and decode a specific attachment
Params:
  - uid: number                # Message UID
  - attachment_id: string      # Attachment content-id or name
  - folder?: string            # IMAP folder
Returns: { name: string, content_type: string, size: number, content_base64: string }
```

#### 3.1.8 mark_as_read

```
Tool: mark_as_read
Description: Mark messages as read or unread using IMAP FLAGS
Params:
  - uid: number                # Message UID
  - read: boolean              # true = mark read, false = mark unread
  - folder?: string            # IMAP folder
Returns: { uid: number, read: boolean }
```

#### 3.1.9 move_email

```
Tool: move_email
Description: Move an email to a different IMAP folder
Params:
  - uid: number                # Message UID
  - from_folder?: string       # Source folder, default "INBOX"
  - to_folder: string          # Destination folder (creates if needed)
Returns: { uid: number, from: string, to: string }
```

#### 3.1.10 delete_email

```
Tool: delete_email
Description: Delete an email (move to Trash folder)
Params:
  - uid: number                # Message UID
  - folder?: string            # Source folder
Returns: { uid: number, status: string }
```

#### 3.1.11 create_folder

```
Tool: create_folder
Description: Create a new IMAP mailbox folder
Params:
  - folder_name: string        # Folder name (supports hierarchy: "Work/Projects")
Returns: { name: string, created: boolean }
```

#### 3.1.12 list_unread

```
Tool: list_unread
Description: Quick listing of unread messages with pagination
Params:
  - folder?: string            # IMAP folder, default "INBOX"
  - limit?: number             # Max results, default 50
  - offset?: number            # Pagination offset
Returns: { total_unread: number, messages: [{ uid: number, subject: string, from: string, date: string }] }
```

### 3.2 SMTP Tools

#### 3.2.1 send_email

```
Tool: send_email
Description: Send an email with text or HTML body
Params:
  - to: string | string[]      # Recipient(s)
  - subject: string            # Email subject
  - body: string               # Email body (supports HTML)
  - html?: string              # Optional HTML body (if body is plain text)
  - from?: string              # Override sender, uses config default
  - cc?: string[]              # CC recipients
  - bcc?: string[]             # BCC recipients
Returns: { message_id: string, status: "sent" }
```

#### 3.2.2 send_email_with_attachment

```
Tool: send_email_with_attachment
Description: Send an email with file attachments
Params:
  - to: string | string[]
  - subject: string
  - body: string
  - attachments: [{ name: string, content: string (base64), content_type: string }][]
  - from?: string
  - cc?: string[]
Returns: { message_id: string, status: "sent", attachments_sent: number }
```

#### 3.2.3 list_drafts

```
Tool: list_drafts
Description: List draft emails in the Drafts folder
Params:
  - folder?: string            # Drafts folder name, default "Drafts"
  - limit?: number             # Max results
Returns: { drafts: [{ uid: number, subject: string, from: string, date: string }] }
```

#### 3.2.4 save_as_draft

```
Tool: save_as_draft
Description: Save an email as a draft
Params:
  - subject: string
  - body: string
  - to?: string[]
  - cc?: string[]
  - html?: string
Returns: { uid: number, folder: string }
```

#### 3.2.5 delete_draft

```
Tool: delete_draft
Description: Delete a draft email
Params:
  - uid: number
  - folder?: string            # Drafts folder
Returns: { uid: number, status: "deleted" }
```

### 3.3 MCP Resources

| Resource | Description | URI Template |
|----------|-------------|-------------|
| email_body | Parsed email body text | `email://<folder>/<uid>/body` |
| email_headers | Email headers | `email://<folder>/<uid>/headers` |
| email_attachment | Attachment data | `email://<folder>/<uid>/attach/<name>` |

### 3.4 MCP Prompts

| Prompt | Description | Arguments |
|--------|-------------|-----------|
| search_emails | "Help me search my emails" | query, date_range, folder |
| compose_reply | "Draft a reply to this email" | email_uid, tone |
| organize_inbox | "Help me organize my inbox" | criteria, folder |

---

## 4. Connection Management

### 4.1 Connection Pool Architecture

```
ConnectionPoolManager
├── imapConnection: ImapFlow instance
├── smtpConnection: nodemailer Transport
├── state: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'
├── reconnectAttempts: number
├── maxReconnectAttempts: 5
├── reconnectDelay: 1000ms (exponential backoff)
```

### 4.2 Lifecycle

1. **Lazy init**: Connection opens on first tool call
2. **Keep-alive**: Connection stays open for the lifetime of the MCP server process
3. **Auto-reconnect**: On network error or timeout, reconnect with exponential backoff (1s, 2s, 4s, 8s, 16s)
4. **Graceful close**: On SIGTERM/SIGINT, close all connections and flush SMTP queue

### 4.3 Configuration

```typescript
interface ConnectionConfig {
  imap: {
    host: string;       // e.g. "imap.gfam.my.id"
    port: number;       // 993 (SSL) or 143 (STARTTLS)
    user: string;       // "geebo@gfam.my.id"
    password: string;   // from IMAP_PASSWORD env var
    tls: boolean;       // true for port 993
    tlsOptions: object; // per-host TLS config from nodemailer
  };
  smtp: {
    host: string;       // e.g. "smtp.gfam.my.id"
    port: number;       // 465 (SSL) or 587 (STARTTLS)
    secure: boolean;    // true for port 465
    auth: { user, pass };
  };
}
```

---

## 5. NPM Packaging

### 5.1 package.json

```json
{
  "name": "@gfam/imap-server",
  "version": "0.1.0",
  "type": "module",
  "description": "IMAP/SMTP MCP Server — email operations via Model Context Protocol",
  "main": "dist/index.js",
  "bin": {
    "imap-mcp": "dist/index.js"
  },
  "files": [
    "dist/",
    "src/"
  ],
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/server": "^2026.8.0",
    "imapflow": "^1.7.0",
    "nodemailer": "^9.0.0",
    "mailparser": "^3.9.0",
    "zod": "^4.0.0",
    "dotenv": "^17.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^22.0.0",
    "@types/nodemailer": "^8.0.0",
    "tsx": "^4.19.0",
    "vitest": "^2.0.0"
  }
}
```

### 5.2 Entry Point (src/index.ts)

```typescript
#!/usr/bin/env node
import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { config } from './config';
import { registerImapTools } from './imap';
import { registerSmtpTools } from './smtp';
import { registerResources } from './resources';
import { registerPrompts } from './prompts';

async function main() {
  const server = new McpServer({
    name: 'imap-mcp',
    version: '0.1.0',
  });

  // Register all tools
  await registerImapTools(server, config);
  await registerSmtpTools(server, config);

  // Register resources and prompts
  await registerResources(server, config);
  await registerPrompts(server, config);

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

### 5.3 npx Usage

```bash
# Run directly via npx (no install needed)
npx -y @gfam/imap-server

# Run with custom env
IMAP_HOST=imap.gmail.com IMAP_USER=you@gmail.com IMAP_PASSWORD=app-password \
  npx -y @gfam/imap-server
```

### 5.4 TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## 6. Error Handling

### 6.1 Error Hierarchy

| Error Type | Source | Recovery |
|------------|--------|----------|
| ConnectionError | imapflow/nodemailer | Auto-reconnect, retry tool |
| AuthError | IMAP login failure | Surface to user, log details |
| ValidationError | Zod schema mismatch | Return structured error, no crash |
| NetworkError | DNS, timeout, TLS | Reconnect with backoff |
| RateLimitError | Server throttling | Back off, retry after delay |

### 6.2 Tool Error Response Pattern

Every tool wraps its body in a try/catch and returns:

```typescript
{
  success: boolean,
  data?: any,
  error?: {
    code: string,      // e.g. "IMAP_AUTH_FAILED", "NETWORK_TIMEOUT"
    message: string,   // Human-readable description
    retryable: boolean // Whether the client should retry
  }
}
```

---

## 7. Security Considerations

1. **Credentials**: Never logged or returned in responses. Loaded from env vars (`IMAP_HOST`, `IMAP_USER`, `IMAP_PASSWORD`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`).
2. **TLS**: IMAP connections use TLS (port 993). SMTP uses TLS (port 465) or STARTTLS (port 587).
3. **No OAuth2 (initial)**: Plain password auth only. OAuth2 can be added later as an extension.
4. **Attachment size limit**: Configurable max (default 10 MB) to prevent memory exhaustion.
5. **Search rate limiting**: Max 50 results per query, paginated to prevent server abuse.

---

## 8. Dependencies Summary

| Dependency | Version | License | Role |
|------------|---------|---------|------|
| `@modelcontextprotocol/server` | ^2026.8.0 | MIT | MCP server framework |
| `imapflow` | ^1.7.0 | MIT | IMAP client |
| `nodemailer` | ^9.0.0 | MIT | SMTP client |
| `mailparser` | ^3.9.0 | MIT | MIME body parsing |
| `zod` | ^4.0.0 | MIT | Schema validation |
| `dotenv` | ^17.0.0 | MIT | Env var loading |
| `typescript` | ^5.5.0 | Apache-2.0 | Build tool |
| `tsx` | ^4.19.0 | MIT | Dev-time TS execution |
| `vitest` | ^2.0.0 | MIT | Test runner |

---

## 9. Implementation Phases

| Phase | Scope | Deliverable |
|-------|-------|-------------|
| Phase 1 | IMAP read operations (list_folders, search, fetch, body, headers) | Working read-only IMAP server |
| Phase 2 | IMAP write operations (flags, move, delete, create_folder) | Full IMAP CRUD |
| Phase 3 | SMTP operations (send, send_with_attachment, drafts) | Full send/receive |
| Phase 4 | Resources, prompts, error handling, tests | Production-ready package |
| Phase 5 | NPM publish, npx testing, docs | `@gfam/imap-server` on npm |

---

## 10. Appendix: Reference Implementations

Several production IMAP MCP servers validate this design:

- `imap-mcp-server` — Multi-account, encrypted credentials, 15+ provider presets
- `@mindstone-engineering/mcp-server-email-imap` — Simple env-var config
- `mailbox-mcp` — Supports Gmail API + IMAP + JMAP
- `@kbzowski/mcp-inbox` — SQLite cache + IDLE push

All use `imapflow` + `nodemailer` + MCP SDK v2 pattern.
