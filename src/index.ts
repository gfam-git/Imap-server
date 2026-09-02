#!/usr/bin/env node

import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { config } from './config.js';
import { registerImapTools } from './imap/index.js';
import { registerSmtpTools } from './smtp/index.js';
import { closeConnections } from './connection.js';

async function main() {
  const server = new McpServer({
    name: 'imap-mcp',
    version: '0.1.3',
  });

  // Register all IMAP tools (Phase 1/2)
  await registerImapTools(server, config);

  // Register all SMTP tools (Phase 3)
  await registerSmtpTools(server, config);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await closeConnections();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await closeConnections();
    process.exit(0);
  });

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
