# Simple IMAP MCP Project - Document Inventory

> Generated: 2026-08-29
> Scope: All design and technical documents across kanban tasks, workspace, and Nextcloud collective.

---

## A. Design & Technical Documents (in workspace)

| # | File | Path | Size | Created By | Related Task |
|---|------|------|------|------------|--------------|
| 1 | design-doc.md | /opt/data/profiles/geebo/workspace/simple-imap-mcp/design-doc.md | 21 KB | t_5f8e4586 | Draft technical design document |
| 2 | research-findings.md | /opt/data/profiles/geebo/workspace/simple-imap-mcp/research-findings.md | 7.6 KB | t_594475cc | Research Node.js MCP libraries and patterns |
| 3 | package.json | /opt/data/profiles/geebo/workspace/simple-imap-mcp/package.json | 722 B | t_dfbe2e99 | Phase 1: IMAP read operations |
| 4 | tsconfig.json | /opt/data/profiles/geebo/workspace/simple-imap-mcp/tsconfig.json | 376 B | t_dfbe2e99 | Phase 1: IMAP read operations |
| 5 | .env.example | /opt/data/profiles/geebo/workspace/simple-imap-mcp/.env.example | 252 B | t_dfbe2e99 | Phase 1: IMAP read operations |
| 6 | .gitignore | /opt/data/profiles/geebo/workspace/simple-imap-mcp/.gitignore | 33 B | t_dfbe2e99 | Phase 1: IMAP read operations |
| 7 | check-api.js | /opt/data/profiles/geebo/workspace/simple-imap-mcp/check-api.js | 294 B | manual | API verification script |

---

## B. Source Code Documents (in workspace)

### Core Files
| # | File | Path | Description |
|---|------|------|-------------|
| 1 | src/index.ts | /opt/data/profiles/geebo/workspace/simple-imap-mcp/src/index.ts | Entry point wiring all tools |
| 2 | src/config.ts | /opt/data/profiles/geebo/workspace/simple-imap-mcp/src/config.ts | Config loader (env vars, .env) |
| 3 | src/connection.ts | /opt/data/profiles/geebo/workspace/simple-imap-mcp/src/connection.ts | Connection pool manager (IMAP + SMTP) |
| 4 | src/schema.ts | /opt/data/profiles/geebo/workspace/simple-imap-mcp/src/schema.ts | Shared Zod schemas (request/response types) |

### IMAP Module
| # | File | Path | Description |
|---|------|------|-------------|
| 1 | src/imap/index.ts | /opt/data/profiles/geebo/workspace/simple-imap-mcp/src/imap/index.ts | Tool registration |
| 2 | src/imap/list-folders.ts | /opt/data/profiles/geebo/workspace/simple-imap-mcp/src/imap/list-folders.ts | list_folders tool |
| 3 | src/imap/search-emails.ts | /opt/data/profiles/geebo/workspace/simple-imap-mcp/src/imap/search-emails.ts | search_emails tool |
| 4 | src/imap/fetch-email.ts | /opt/data/profiles/geebo/workspace/simple-imap-mcp/src/imap/fetch-email.ts | fetch_email tool |
| 5 | src/imap/email-body.ts | /opt/data/profiles/geebo/workspace/simple-imap-mcp/src/imap/email-body.ts | get_email_body tool |
| 6 | src/imap/email-headers.ts | /opt/data/profiles/geebo/workspace/simple-imap-mcp/src/imap/email-headers.ts | get_email_headers tool |

### SMTP Module
| # | File | Path | Description |
|---|------|------|-------------|
| 1 | src/smtp/index.ts | /opt/data/profiles/geebo/workspace/simple-imap-mcp/src/smtp/index.ts | Tool registration |
| 2 | src/smtp/send-email.ts | /opt/data/profiles/geebo/workspace/simple-imap-mcp/src/smtp/send-email.ts | send_email tool |
| 3 | src/smtp/send-with-attach.ts | /opt/data/profiles/geebo/workspace/simple-imap-mcp/src/smtp/send-with-attach.ts | send_email_with_attachment tool |
| 4 | src/smtp/drafts.ts | /opt/data/profiles/geebo/workspace/simple-imap-mcp/src/smtp/drafts.ts | list_drafts, save_as_draft, delete_draft |

### Compiled Output (dist/)
| # | File | Path |
|---|------|------|
| 1 | dist/config.js | /opt/data/profiles/geebo/workspace/simple-imap-mcp/dist/config.js |
| 2 | dist/connection.js | /opt/data/profiles/geebo/workspace/simple-imap-mcp/dist/connection.js |
| 3 | dist/imap/index.js | /opt/data/profiles/geebo/workspace/simple-imap-mcp/dist/imap/index.js |
| 4 | dist/imap/list-folders.js | /opt/data/profiles/geebo/workspace/simple-imap-mcp/dist/imap/list-folders.js |
| 5 | dist/imap/search-emails.js | /opt/data/profiles/geebo/workspace/simple-imap-mcp/dist/imap/search-emails.js |
| 6 | dist/imap/fetch-email.js | /opt/data/profiles/geebo/workspace/simple-imap-mcp/dist/imap/fetch-email.js |
| 7 | dist/imap/email-body.js | /opt/data/profiles/geebo/workspace/simple-imap-mcp/dist/imap/email-body.js |
| 8 | dist/imap/email-headers.js | /opt/data/profiles/geebo/workspace/simple-imap-mcp/dist/imap/email-headers.js |
| 9 | dist/smtp/index.js | /opt/data/profiles/geebo/workspace/simple-imap-mcp/dist/smtp/index.js |
| 10 | dist/smtp/send-email.js | /opt/data/profiles/geebo/workspace/simple-imap-mcp/dist/smtp/send-email.js |
| 11 | dist/smtp/send-with-attach.js | /opt/data/profiles/geebo/workspace/simple-imap-mcp/dist/smtp/send-with-attach.js |
| 12 | dist/smtp/drafts.js | /opt/data/profiles/geebo/workspace/simple-imap-mcp/dist/smtp/drafts.js |

---

## C. Requirements Document (in task comment)

| # | Description | Location | Related Task |
|---|-------------|----------|--------------|
| 1 | IMAP MCP Requirements (12 IMAP ops, 5 SMTP ops, auth, performance, output format, NPM packaging) | Task t_e2b1ffdf comment at 2026-08-26 23:41 | Gather IMAP MCP requirements from user |

---

## D. Nextcloud Collective Documents

| # | Page | Path | Size | Last Modified |
|---|------|------|------|---------------|
| 1 | Readme.md (Landing page) | .Collectives/Simple IMAP MCP Project/Readme.md | 461 B | 2026-08-27 |

Note: The collective currently only has the default landing page. No project documents have been migrated yet. Task t_3083501c ("Migrate documents to the new collective") is still in "ready" status.

---

## E. Phase Task Documents (in scratch workspaces)

### t_905104d0 - Phase 4: Resources, Prompts, Tests, Docs
| # | File | Path | Description | Status |
|---|------|------|-------------|--------|
| 1 | src/resources/email-body.ts | /opt/data/kanban/boards/simple-imap-mcp-server/workspaces/t_905104d0/src/resources/email-body.ts | Resource handler for email://<uid>/body | Created (unverified) |
| 2 | src/resources/email-headers.ts | /opt/data/kanban/boards/simple-imap-mcp-server/workspaces/t_905104d0/src/resources/email-headers.ts | Resource handler for email://<uid>/headers | Created (unverified) |
| 3 | src/prompts/search-template.ts | /opt/data/kanban/boards/simple-imap-mcp-server/workspaces/t_905104d0/src/prompts/search-template.ts | "Help me search my emails" prompt | Created (unverified) |
| 4 | src/prompts/compose-template.ts | /opt/data/kanban/boards/simple-imap-mcp-server/workspaces/t_905104d0/src/prompts/compose-template.ts | "Draft a reply" prompt | Created (unverified) |
| 5 | src/prompts/folder-organize.ts | /opt/data/kanban/boards/simple-imap-mcp-server/workspaces/t_905104d0/src/prompts/folder-organize.ts | "Organize my inbox" prompt | Created (unverified) |
| 6 | tests/imap.test.ts | /opt/data/kanban/boards/simple-imap-mcp-server/workspaces/t_905104d0/tests/imap.test.ts | 13 IMAP tests (mocked) | Created (unverified) |
| 7 | tests/smtp.test.ts | /opt/data/kanban/boards/simple-imap-mcp-server/workspaces/t_905104d0/tests/smtp.test.ts | 9 SMTP tests (mocked) | Created (unverified) |
| 8 | tests/connection.test.ts | /opt/data/kanban/boards/simple-imap-mcp-server/workspaces/t_905104d0/tests/connection.test.ts | 10 connection pool tests | Created (unverified) |
| 9 | README.md | /opt/data/kanban/boards/simple-imap-mcp-server/workspaces/t_905104d0/README.md | Full usage docs, API reference | Created (unverified) |

Note: t_905104d0 had a comment claiming all 9 files were created and verified, but the task status is still "ready" and the worker never called kanban_complete. Files are in the scratch workspace and may have been cleaned up.

---

## F. Summary Counts

| Category | Count |
|----------|-------|
| Design/technical docs (workspace) | 7 |
| Source code files (workspace src/) | 14 |
| Compiled outputs (dist/) | 12 |
| Requirements (task comment) | 1 |
| Nextcloud collective pages | 1 |
| Phase 4 deliverables (scratch) | 9 |
| **Total unique documents** | **~44** |

---

## G. Pending Migration

The following documents need to be migrated to the Nextcloud collective (task t_3083501c):

1. design-doc.md (21 KB)
2. research-findings.md (7.6 KB)
3. package.json
4. tsconfig.json
5. .env.example
6. .gitignore
7. check-api.js
8. All src/ files (14 files)
9. README.md from Phase 4 scratch workspace (if it exists)

Collective: "Simple IMAP MCP Project" (ID 2)
Path: .Collectives/Simple IMAP MCP Project/
Shared with: adam.giunta@gfam.my.id (full admin, permissions 31)
