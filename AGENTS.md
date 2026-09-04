# AGENTS.md - Simple IMAP MCP Server

## Project Summary

The Simple IMAP MCP Server is a Node.js application that provides email operations through the Model Context Protocol (MCP). It exposes 15 IMAP tools, 5 SMTP tools, 2 MCP resources, and 3 MCP prompts to LLM clients (Claude Desktop, CLI tools, IDEs, remote web dashboards). The server supports two transport modes: stdio (local desktop clients) and Streamable HTTP (remote LLM clients).

## Dependencies and Purpose

### Runtime Dependencies

- `@modelcontextprotocol/server` ^2.0.0 — Official MCP SDK v2 (server transport, tool/resource/prompt registration)
- `imapflow` ^1.7.0 — IMAP client library (IMAP4rev2 support, auto-extension handling, connection pooling)
- `nodemailer` ^9.0.0 — SMTP client library (send, attachments, HTML, DKIM)
- `mailparser` ^3.9.0 — MIME parser (raw email to structured text/html)
- `node-html-markdown` ^2.0.0 - HTML to Markdown conversion library for converting email content to LLM friendly markdown.
- `zod` ^4.0.0 — Schema validation (required peer dep of MCP SDK v2)
- `dotenv` ^17.0.0 — Credential management via .env file

### Dev Dependencies

- `typescript` ^5.5.0 — TypeScript compiler (ES2022 target, strict mode, ESM)
- `@types/node` ^22.0.0 — Node.js type definitions
- `@types/nodemailer` ^8.0.0 — Nodemailer type definitions
- `tsx` ^4.19.0 — TypeScript execution for dev mode

## File Structure and Naming Conventions

```
@adam-gfam/imap-server/
├── package.json              # NPM manifest, bin entry, scripts
├── tsconfig.json             # TypeScript config (ES2022, ESM, strict)
├── .env.example              # Credential template
├── .gitignore                # Excludes dist/, node_modules/, .env
├── README.md                 # Usage docs, API reference, links
├── AGENTS.md                 # This file — project guidelines for agents
│
├── src/
│   ├── index.ts              # Single entry point — creates MCP server, wires tools
│   ├── config.ts             # Config loader (env vars, .env, CLI args)
│   ├── connection.ts         # Connection pool manager (IMAP + SMTP)
│   ├── schema.ts             # Shared Zod schemas (request/response types)
│   ├── imap/                 # IMAP tool registrations
│   ├── smtp/                 # SMTP tool registrations
│   ├── resources/
│   │   ├── email-body.ts     # Resource template: email://<folder>/<uid>/body
│   │   └── email-headers.ts  # Resource template: email://<folder>/<uid>/headers
│   └── prompts/
│       ├── search-template.ts  # Prompt: "Help me search emails"
│       ├── compose-template.ts # Prompt: "Draft a reply"
│       └── folder-organize.ts  # Prompt: "Organize my inbox"
│
├── tests/                    # Test files (if added)
│
└── dist/                     # Compiled output (gitignored)
```

**Naming conventions:**
- Source files use kebab-case (e.g., `search-emails.ts`, `email-headers.ts`)
- Tools are registered with snake_case names (e.g., `search_emails`, `get_email_body`)
- All source files are TypeScript (.ts), compiled to ES2022 ESM in dist/

## Best Practices

### Branching

- Work on dedicated branches off `dev`. Never commit directly to `master`.
- Use descriptive branch names: `feature/add-draft-search`, `fix/imap-timeout`, `docs/update-config-guide`.

### Build Validation

- Always run `npm run build` (invokes `tsc`) before committing or submitting a PR.
- The TypeScript config enforces strict mode (`strict: true`, `noImplicitAny: true`), so all code must compile cleanly.
- Fix any type errors or lint issues before proceeding.

### Testing

- Write tests alongside new features. Use TypeScript test files under `tests/`.
- Mock external dependencies (imapflow, nodemailer) — do not test against live servers.
- Run tests locally before submitting: `npx vitest run` (if test framework is configured).

### PR Workflow

1. Create a feature branch from `master`.
2. Make changes, run `npm run build`, and verify everything compiles.
3. Submit a pull request against `master`.
4. Update the Nextcloud Collective documentation before merging (see below).

### Documentation Updates

- All design and technical documents must be created directly in the Nextcloud Collective, not locally.
- The Collective is the single source of truth for all project documentation.
- After any significant change, update the relevant Collective page(s).

### Security — NO Secrets Check-in

- Never commit `.env`, SSH keys, NPM tokens, passwords, or any credentials.
- `.env` is listed in `.gitignore`. `.env.example` contains placeholder values only.
- `.netrc` is gitignored for SSH authentication credentials.

## Using bws-secret-get

For SSH keys and NPM tokens, use the `bws-secret-get` skill/tool to retrieve secrets from Bitwarden. Do not hardcode or store secrets in files.

- SSH key for GitHub: Retrieve from Bitwarden secret "Geebo SSH" (verified with `ssh -T git@github.com`)
- NPM token: Retrieve from Bitwarden when publishing packages

Example usage pattern:
```bash
# SSH key retrieval
bws secret list | grep "Geebo SSH"
# Then fetch the actual key value for authentication

# NPM token retrieval
bws secret list | grep "NPM"
# Use the token for npm publish operations
```

## Links

### GitHub Repository

- **Git URL:** `git@github.com:gfam-git/Imap-server.git`
- **HTTPS browse:** `https://github.com/gfam-git/Imap-server`

### NPM Package

- **Package name:** `@adam-gfam/imap-server`
- **NPM registry:** `https://www.npmjs.com/package/@adam-gfam/imap-server`

### Nextcloud Collective (Documentation)

- **Collective:** Simple IMAP MCP Project
- **Public landing page:** `https://nc.nousresearch.com/apps/collectives/Simple%20IMAP%20MCP%20Project`
- **Project Overview:** `https://nc.nousresearch.com/apps/collectives/Simple%20IMAP%20MCP%20Project/Project%20Overview`
- **API Reference:** `https://nc.nousresearch.com/apps/collectives/Simple%20IMAP%20MCP%20Project/API%20Reference`
- **Source Code Index:** `https://nc.nousresearch.com/apps/collectives/Simple%20IMAP%20MCP%20Project/Source%20Code%20Index`
- **Configuration Guide:** `https://nc.nousresearch.com/apps/collectives/Simple%20IMAP%20MCP%20Project/Configuration%20Guide`
