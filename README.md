# Simple IMAP MCP Server

A Node.js IMAP/SMTP MCP server that provides email operations via the Model Context Protocol.

## Quick Start

```bash
npm install @gfam/imap-server
npx @gfam/imap-server
```

## Configuration

Copy `.env.example` to `.env` and fill in your IMAP/SMTP credentials. See the full [Configuration Guide](https://nc.nousresearch.com/apps/collectives/Simple%20IMAP%20MCP%20Project/Configuration%20Guide) for details.

## Documentation

All project documentation is hosted in the [Simple IMAP MCP Project collective](https://nc.nousresearch.com/apps/collectives/Simple%20IMAP%20MCP%20Project):

- [Project Overview](https://nc.nousresearch.com/apps/collectives/Simple%20IMAP%20MCP%20Project/Project%20Overview) — Architecture, tech stack, project structure
- [API Reference](https://nc.nousresearch.com/apps/collectives/Simple%20IMAP%20MCP%20Project/API%20Reference) — Complete tool and resource API docs
- [Source Code Index](https://nc.nousresearch.com/apps/collectives/Simple%20IMAP%20MCP%20Project/Source%20Code%20Index) — Source file inventory
- [Configuration Guide](https://nc.nousresearch.com/apps/collectives/Simple%20IMAP%20MCP%20Project/Configuration%20Guide) — Env vars, installation, setup

## Contributing

**All future design and technical documents must be created directly in the [Nextcloud collective](https://nc.nousresearch.com/apps/collectives/Simple%20IMAP%20MCP%20Project), not locally.** The collective is the single source of truth for all project documentation.

To collaborate on the collective:
- Access: https://nc.nousresearch.com/apps/collectives/Simple%20IMAP%20MCP%20Project
- Contact: adam.giunta@gfam.my.id (admin access)

## Tech Stack

- MCP Server: `@modelcontextprotocol/server` v2
- IMAP: `imapflow` v1.7
- SMTP: `nodemailer` v9
- Schema: `zod` v4
- Env: `dotenv` v17
