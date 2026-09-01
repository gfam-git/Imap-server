# Simple IMAP MCP Server

A Node.js IMAP/SMTP MCP server that provides email operations via the Model Context Protocol.

## Quick Start

```bash
# Install and run locally
npm install @adam-gfam/imap-server

# OR run without installing
npx -y @adam-gfam/imap-server
```

## Configuration

Copy `.env.example` to `.env` and fill in your IMAP/SMTP credentials. See the full [Configuration Guide](https://our.gfam.my.id/apps/collectives/p/MGwd9JDeJ9wGDzS/Simple-IMAP-MCP-Project-2/Configuration%20Guide) for details.

## Usage

Once the server is running, it exposes the following tools, resources, and prompts via the MCP protocol.

### Transport Modes

| Mode | Use Case | Configuration |
|------|----------|---------------|
| stdio | Claude Desktop, CLI tools, local agents | Default, no config needed |
| Streamable HTTP | Remote LLM clients, web dashboards | `MCP_TRANSPORT=http`, `HTTP_PORT=3000` |

### IMAP Tools

- **list_folders** — List all IMAP mailboxes/folders. Parameters: `folder_pattern`, `include_subfolders`.
- **search_emails** — Search emails by criteria (folder, from, to, subject, date, keyword, unread_only). Paginated results.
- **fetch_email** — Fetch full email content including headers, body, and attachments by UID.
- **get_email_body** — Fast body-only fetch (text and/or HTML) for a given UID.
- **get_email_headers** — Minimal-bandwidth header fetch without downloading the body.
- **mark_as_read** — Toggle read/unread status via IMAP FLAGS.
- **move_email** — Move an email to a different IMAP folder (creates destination if needed).
- **delete_email** — Delete an email (moves to Trash).
- **create_folder** — Create a new IMAP mailbox folder (supports hierarchy like `"Work/Projects"`).
- **list_unread** — Quick listing of unread messages with pagination.

### SMTP Tools

- **send_email** — Send an email with text or HTML body. Supports `to`, `subject`, `body`, `html`, `from`, `cc`, `bcc`.
- **send_email_with_attachment** — Send an email with file attachments (`[{ name, content (base64), content_type }]`).
- **list_drafts** — List draft emails in the Drafts folder.
- **save_as_draft** — Save an email as a draft (plain text or HTML).
- **delete_draft** — Delete a draft email by UID.

### MCP Resources

| Resource | Description | URI Template |
|----------|-------------|-------------|
| email_body | Parsed email body text | `email://<folder>/<uid>/body` |
| email_headers | Email headers | `email://<folder>/<uid>/headers` |

### MCP Prompts

| Prompt | Description | Arguments |
|--------|-------------|-----------|
| search_emails | "Help me search my emails" | query, date_range, folder |
| compose_reply | "Draft a reply to this email" | email_uid, tone |
| organize_inbox | "Help me organize my inbox" | criteria, folder |

## Documentation

All project documentation is hosted in the [Simple IMAP MCP Project collective](https://our.gfam.my.id/apps/collectives/p/MGwd9JDeJ9wGDzS/Simple-IMAP-MCP-Project-2):

- [Project Overview](https://our.gfam.my.id/apps/collectives/p/MGwd9JDeJ9wGDzS/Simple-IMAP-MCP-Project-2/Project%20Overview) — Architecture, tech stack, project structure
- [API Reference](https://our.gfam.my.id/apps/collectives/p/MGwd9JDeJ9wGDzS/Simple-IMAP-MCP-Project-2/API%20Reference) — Complete tool and resource API docs
- [Source Code Index](https://our.gfam.my.id/apps/collectives/p/MGwd9JDeJ9wGDzS/Simple-IMAP-MCP-Project-2/Source%20Code%20Index) — Source file inventory
- [Configuration Guide](https://our.gfam.my.id/apps/collectives/p/MGwd9JDeJ9wGDzS/Simple-IMAP-MCP-Project-2/Configuration%20Guide) — Env vars, installation, setup

## Contributing

**All future design and technical documents must be created directly in the [Nextcloud collective](https://our.gfam.my.id/apps/collectives/p/MGwd9JDeJ9wGDzS/Simple-IMAP-MCP-Project-2), not locally.** The collective is the single source of truth for all project documentation.

## Tech Stack

- MCP Server: `@modelcontextprotocol/server` v2
- IMAP: `imapflow` v1.7
- SMTP: `nodemailer` v9
- MIME Parser: `mailparser` v3.9
- Schema: `zod` v4
- Env: `dotenv` v17
