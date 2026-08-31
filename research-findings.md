# Node.js IMAP & MCP Library Research Findings

## Date: 2026-08-26

---

## 1. IMAP Libraries Evaluation

### 1.1 ImapFlow (Recommended)
- **Package:** `imapflow`
- **Version:** 1.7.6
- **License:** MIT
- **Weekly downloads:** 1,605,213 (very high)
- **Dependents:** 405
- **Author:** Postal Systems OÜ
- **Repo:** https://github.com/postalsys/imapflow

**Strengths:**
- Modern async/await API, all methods return Promises
- Automatic IMAP extension handling (CONDSTORE, QRESYNC, IDLE, COMPRESS, etc.)
- IMAP4rev2 support (RFC 9051)
- Message streaming via async iterators
- Built-in mailbox locking for safe concurrent access
- Full TypeScript type definitions
- Proxy support (SOCKS, HTTP CONNECT)
- Gmail-specific extensions (labels, raw search via X-GM-EXT-1)
- Battle-tested as the engine behind EmailEngine (self-hosted email API)
- Small bundle, well-maintained, actively updated

**Weaknesses:**
- IMAP-only (no SMTP)
- Requires separate SMTP library for send functionality

**Verdict:** Best choice for IMAP client in the stack.

---

### 1.2 Other IMAP Libraries Considered

| Library | Weekly Dls | License | Notes |
|---------|-----------|---------|-------|
| `imap` (mscdex) | 568,771 | MIT | Old (v0.8.19, last updated 2022), known security vulnerabilities, incompatible with modern Node.js |
| `@dyanet/imap` | New | MIT | Zero-dep replacement for imap-simple, Node.js >= 20.0.0, but very new (Jan 2026) |
| `imap-sdk` | New | MIT | TypeScript, auto resource cleanup, no memory leaks, but very new (Dec 2025) |
| `@mailts/core` | New | MIT | Native SMTP/IMAP over Node.js built-ins, zero runtime deps, but very new |

**Why not the others:** `imap` is deprecated and has known vulnerabilities. `@dyanet/imap` and `imap-sdk` are too new with limited adoption. `imapflow` has the best combination of maturity, adoption, and feature completeness.

---

## 2. MCP (Model Context Protocol) SDK Evaluation

### 2.1 Official MCP TypeScript SDK v2 (Recommended)
- **Package:** `@modelcontextprotocol/server` (v2)
- **License:** MIT
- **Weekly downloads:** 298,081 (for the "everything" example server)
- **Repo:** https://github.com/modelcontextprotocol/typescript-sdk

**Strengths:**
- Official SDK from the Model Context Protocol foundation
- v2 implements the stable 2026-07-28 MCP spec
- Split packages: `@modelcontextprotocol/server` (server), `@modelcontextprotocol/client` (client)
- Optional framework adapters: Express, Fastify, Hono, Node.js HTTP
- Two transport modes: Streamable HTTP (remote) and stdio (local desktop clients)
- Built-in tools, resources, and prompts support
- Zod v4 for schema validation (required peer dependency)
- DNS rebinding protection, CORS support, multi-node deployment patterns
- First-class TypeScript support

**Weaknesses:**
- v2 is new (July 2026 spec) — migration from v1 may be needed for some
- Requires Zod as a peer dependency
- ES modules only (need `"type": "module"` in package.json)

---

### 2.2 Alternative: mcp-server-framework
- **Package:** `mcp-server-framework`
- **Version:** 1.2.0
- **License:** LGPL-3.0
- **Weekly downloads:** Lower than official SDK

**Strengths:**
- Production-ready framework with built-in logging, metrics, sessions
- Multi-transport (stdio, Streamable HTTP, SSE)
- HTTPS/TLS native support
- Stateless mode for serverless deployments
- OpenTelemetry integration

**Weaknesses:**
- LGPL license (not MIT) — potential licensing concerns
- Depends on `@modelcontextprotocol/sdk` v1 (legacy)
- Heavier dependency tree (Express, Zod, Cors, Helmet, etc.)
- Less widely adopted than official SDK

---

## 3. Existing IMAP MCP Servers for Reference

Several production IMAP MCP servers exist that demonstrate the pattern:

| Package | IMAP Lib | SMTP Lib | Weekly Dls | Notes |
|---------|----------|----------|-----------|-------|
| `imap-mcp-server` | imapflow ^1.4.2 | nodemailer ^9.0.1 | Reference | Multi-account, encrypted credentials, 15+ provider presets |
| `@mindstone-engineering/mcp-server-email-imap` | imapflow ^1.2.0 | nodemailer ^8.0.5 | Reference | Simple env-var config, iCloud/Yahoo/custom |
| `mailbox-mcp` | imapflow ^1.3.2 | nodemailer ^8.0.5 | Reference | Supports Gmail API + IMAP + JMAP |
| `@kbzowski/mcp-inbox` | imapflow ^1.3.2 | nodemailer ^9.0.4 | Reference | SQLite cache + IDLE push, near-instant reads |
| `@codefuturist/email-mcp` | Custom IMAP | Custom SMTP | Reference | 47 tools, 7 prompts, 6 resources, scheduling |
| `@lengelhard/imap-email-mcp` | imap-simple ^5.1.0 | nodemailer ^6.9.16 | Reference | Simple, but uses outdated imap-simple |
| `twosg/imap-mcp` | Basic IMAP | Basic SMTP | Reference | Minimal implementation |

**Key pattern:** Nearly all production IMAP MCP servers use `imapflow` for IMAP and `nodemailer` for SMTP. This confirms the best-practice stack.

---

## 4. Recommended Stack

### Core Dependencies
```json
{
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
    "@types/nodemailer": "^8.0.0"
  }
}
```

### Why This Stack
1. **`@modelcontextprotocol/server`** — Official MCP SDK v2, the standard for building MCP servers in Node.js
2. **`imapflow`** — Most popular, battle-tested IMAP library for Node.js; handles all extensions automatically
3. **`nodemailer`** — Standard Node.js SMTP library; handles attachments, HTML, DKIM, and all send patterns
4. **`mailparser`** — Parses raw email MIME content into structured text/html (complements imapflow)
5. **`zod`** — Required peer dependency of MCP SDK v2 for schema validation
6. **`dotenv`** — Secure credential management via `.env` file

### Architecture Pattern
- Single entry point (`src/index.ts`)
- MCP server using stdio transport (for Claude Desktop, CLI tools)
- Connection pooling for IMAP/SMTP
- Credentials via environment variables (IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASSWORD, SMTP_HOST, SMTP_PORT)
- NPM package with `bin` field for `npx` execution

---

## 5. NPM Packaging Strategy

### package.json Essentials
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
    "dist",
    "src"
  ],
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node --esm src/index.ts"
  }
}
```

### Entry Point Pattern
```typescript
import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
```

### npx Usage
```bash
npx -y @gfam/imap-server
```

---

## 6. Conclusion

The recommended stack (`@modelcontextprotocol/server` + `imapflow` + `nodemailer`) is:
- **Proven:** All three libraries are widely used in production IMAP MCP servers
- **Modern:** Official MCP v2 SDK, latest IMAP4rev2 support, TypeScript-first
- **Lightweight:** Minimal dependency count, suitable for npx delivery
- **Flexible:** Supports any IMAP/SMTP server, configurable via environment variables
- **Maintainable:** Clean separation of concerns (MCP server layer, IMAP layer, SMTP layer)

This stack directly replaces the existing Python `fetch_emails.py` script and extends it with full MCP integration, SMTP send capabilities, and connection pooling.
