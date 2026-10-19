# AGENTS.md — Simple IMAP MCP Server Guide for AI Agents

## Project Summary

The Simple IMAP MCP Server (`@adam-gfam/imap-server`) is a Node.js application that provides email operations through the Model Context Protocol (MCP). It exposes 15 IMAP tools (folder management, search, read, move, delete, flag, list unread), 5 SMTP tools (send, send with attachment, list drafts, save draft, delete draft), 2 MCP resources (email body, email headers), and 3 MCP prompts (search emails, compose reply, organize inbox) to LLM clients such as Claude Desktop, CLI tools, IDEs, and remote web dashboards. The server supports two transport modes: stdio (default, for local desktop clients) and Streamable HTTP (for remote LLM clients and web dashboards).

## Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@modelcontextprotocol/server` | ^2.0.0 | Official MCP SDK v2 — server transport, tool/resource/prompt registration |
| `imapflow` | ^1.7.0 | IMAP client library — IMAP4rev2 support, auto-extension handling, connection pooling |
| `nodemailer` | ^9.0.0 | SMTP client library — send emails, attachments, HTML, DKIM signing |
| `mailparser` | ^3.9.0 | MIME parser — converts raw email to structured text/html |
| `node-html-markdown` | ^2.0.0 | HTML-to-Markdown conversion library for converting email content to LLM-friendly markdown |
| `zod` | ^4.0.0 | Schema validation — required peer dependency of MCP SDK v2 |
| `dotenv` | ^17.0.0 | Credential management via `.env` file |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.5.0 | TypeScript compiler — ES2022 target, strict mode, ESM module resolution |
| `@types/node` | ^22.0.0 | Node.js type definitions |
| `@types/nodemailer` | ^8.0.0 | Nodemailer type definitions |
| `tsx` | ^4.19.0 | TypeScript execution engine — enables `npm run dev` with live reloading |

## File Structure & Conventions

### Directory Layout

```
@adam-gfam/imap-server/
├── package.json              # NPM manifest, bin entry, scripts
├── tsconfig.json             # TypeScript config (ES2022, ESM, strict)
├── .env.example              # Credential template
├── .gitignore                # Excludes dist/, node_modules/, .env, secrets
├── README.md                 # Usage docs, API reference, links
├── AGENTS.md                 # This file — project guidelines for agents
│
├── src/
│   ├── index.ts              # Single entry point — creates MCP server, wires tools
│   ├── config.ts             # Config loader (env vars, .env, CLI args)
│   ├── connection.ts         # Connection pool manager (IMAP + SMTP)
│   ├── schema.ts             # Shared Zod schemas (request/response types)
│   ├── markdown.ts           # HTML-to-Markdown conversion utility
│   ├── imap/                 # IMAP tool implementations
│   │   ├── index.ts          # IMAP tool exports
│   │   ├── create-folder.ts
│   │   ├── delete-email.ts
│   │   ├── email-body.ts
│   │   ├── email-headers.ts
│   │   ├── email-waiting.ts
│   │   ├── flags.ts
│   │   ├── list-folders.ts
│   │   ├── list-unread.ts
│   │   ├── move-email.ts
│   │   ├── search-emails.ts
│   ├── smtp/                 # SMTP tool implementations
│   │   ├── index.ts          # SMTP tool exports
│   │   ├── drafts.ts
│   │   ├── send-email.ts
│   │   └── send-with-attach.ts
│
├── tests/                    # Test files (if added)
└── dist/                     # Compiled output (gitignored)
```

### Naming Conventions

- **Source files:** kebab-case (e.g., `search-emails.ts`, `email-headers.ts`, `send-with-attach.ts`)
- **Tool names:** snake_case (e.g., `search_emails`, `get_email_body`, `send_email_with_attachment`)
- **Schema objects:** PascalCase (e.g., `SearchEmailsSchema`, `SendEmailSchema`)
- **Functions:** camelCase (e.g., `listFolders`, `searchEmails`, `sendEmail`)
- **Environment variables:** UPPER_SNAKE_CASE (e.g., `IMAP_HOST`, `SMTP_PORT`, `SMTP_SECURE`)

### Where to Place New Files

- **New IMAP tools:** Add implementation to `src/imap/<tool-name>.ts`, export from `src/imap/index.ts`, and register the tool in `src/index.ts`.
- **New SMTP tools:** Add implementation to `src/smtp/<tool-name>.ts`, export from `src/smtp/index.ts`, and register the tool in `src/index.ts`.
- **New Zod schemas:** Add to `src/schema.ts`.
- **New config variables:** Add to `.env.example` and validate in `src/config.ts`.
- **New utilities:** Add to top-level `src/` (e.g., `src/markdown.ts`).
- **New test files:** Add to `tests/` directory.

### Branching Convention

- **Branch naming:** `<work-type>/<friendly-name>` (e.g., `feat/add-search-tool`, `bug/fix-missing-uid`, `docs/update-agents`).
- Always branch from `origin/master`.

## Best Practices

- Each task should have a dedicated branch off `master`. Sub-tasks can use the branch the parent task is in.
- Use `npm run build` to validate changes compile without errors.
- Test all your changes.
- Create a pull request once all changes are complete to merge to master.
- Update the technical documentation in the Nextcloud Collective.
- **!IMPORTANT: never check in any secrets or keys.**

## Secrets Retrieval

Agents must use the `bws-secret-get` skill to retrieve GIT SSH keys and NPM tokens from the Bitwarden Secrets Manager CLI. Agents must verify SSH authentication is set up before making changes.

- **GIT SSH Key:** `bws secret get 05dd85ef-4dca-4747-b35e-b4b4002149a4` — Retrieve the SSH private key for GitHub authentication. Verify with `ssh -T git@github.com` before pushing.
- **NPM Token:** `bws secret get b1d04494-b18b-479c-8cda-b4b6018905d8` — Retrieve the NPM auth token for publishing packages.

Always use `bws secret list` first to confirm the correct secret-id, then `bws secret get <SECRET_ID>` to retrieve the full value. Never hardcode or echo secret values in comments, logs, or PR descriptions.

## Links

- [Github Remote Repo](git@github.com:gfam-git/Imap-server.git) — The SSH clone URL for the git repo.
- [@adam-gfam/imap-server](https://www.npmjs.com/package/@adam-gfam/imap-server) — NPM package listing.
- [Simple IMAP MCP Project](https://our.gfam.my.id/apps/collectives/Simple-IMAP-MCP-Project-2) — Nextcloud collective (requires auth/account).
- [Simple IMAP MCP Project (public link)](https://our.gfam.my.id/apps/collectives/p/MGwd9JDeJ9wGDzS/Simple-IMAP-MCP-Project-2) — Public read-only link.
