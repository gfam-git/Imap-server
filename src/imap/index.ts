import { McpServer } from '@modelcontextprotocol/server';
import { config as appConfig, type AppConfig } from '../config.js';
import { listFolders } from './list-folders.js';
import { searchEmails } from './search-emails.js';
import { getEmailBody } from './email-body.js';
import { getEmailHeaders } from './email-headers.js';
import { markAsRead } from './flags.js';
import { moveEmail } from './move-email.js';
import { deleteEmail } from './delete-email.js';
import { createFolder } from './create-folder.js';
import { listUnread } from './list-unread.js';
import { emailWaiting } from './email-waiting.js';
import { z } from 'zod';

// Tool parameter schemas (Zod)
const listFoldersParams = z.object({
  folder_pattern: z.string().optional().describe('IMAP wildcard pattern, default "*"'),
  include_subfolders: z.boolean().optional().describe('true for recursive listing'),
});

const searchEmailsParams = z.object({
  folder: z.string().optional().describe('IMAP folder, default "INBOX"'),
  from: z.string().optional().describe('Sender address filter'),
  to: z.string().optional().describe('Recipient address filter'),
  subject: z.string().optional().describe('Subject substring match'),
  date_from: z.string().optional().describe('ISO 8601 date, e.g. "2026-08-01"'),
  date_to: z.string().optional().describe('ISO 8601 date'),
  keyword: z.string().optional().describe('General body/keyword search'),
  unread_only: z.boolean().optional().describe('Only unread messages'),
  limit: z.number().int().optional().describe('Max results, default 10'),
  offset: z.number().int().optional().describe('Pagination offset, default 0'),
});

const fetchEmailParams = z.object({
  uid: z.number().int().positive().describe('Message UID in the folder'),
  folder: z.string().optional().describe('IMAP folder, default "INBOX"'),
  include_body: z.boolean().optional().default(true).describe('Include parsed body, default true'),
  include_attachments: z.boolean().optional().default(false).describe('Include attachment data, default false'),
});

const getEmailBodyParams = z.object({
  uid: z.number().int().positive().describe('Message UID'),
  folder: z.string().optional().describe('IMAP folder'),
  text_only: z.boolean().optional().describe('If true, return only plain text'),
});

const getEmailHeadersParams = z.object({
  uid: z.number().int().positive().describe('Message UID'),
  folder: z.string().optional().describe('IMAP folder'),
});

const markAsReadParams = z.object({
  uid: z.number().int().positive().describe('Message UID'),
  read: z.boolean().describe('true = mark read, false = mark unread'),
  folder: z.string().optional().describe('IMAP folder'),
});

const moveEmailParams = z.object({
  uid: z.number().int().positive().describe('Message UID'),
  from_folder: z.string().optional().describe('Source folder, default "INBOX"'),
  to_folder: z.string().describe('Destination folder (creates if needed)'),
});

const deleteEmailParams = z.object({
  uid: z.number().int().positive().describe('Message UID'),
  folder: z.string().optional().describe('Source folder'),
});

const createFolderParams = z.object({
  folder_name: z.string().describe('Folder name (supports hierarchy: "Work/Projects")'),
});

const listUnreadParams = z.object({
  folder: z.string().optional().describe('IMAP folder, default "INBOX"'),
  limit: z.number().int().optional().describe('Max results, default 50'),
  offset: z.number().int().optional().describe('Pagination offset'),
});

const emailWaitingParams = z.object({
  folder: z.string().optional().describe('IMAP folder, default "INBOX"'),
  conditions: z.object({
    from: z.string().optional().describe('Sender address filter'),
    to: z.string().optional().describe('Recipient address filter'),
    subject: z.string().optional().describe('Subject substring match'),
    date_from: z.string().optional().describe('ISO 8601 date, e.g. "2026-08-01"'),
    date_to: z.string().optional().describe('ISO 8601 date'),
    keyword: z.string().optional().describe('General body/keyword search'),
    unread_only: z.boolean().optional().describe('Only unread messages'),
  }).optional().describe('Search conditions (same as search_emails)'),
  timeout: z.number().int().optional().describe('Max seconds to wait, default 30'),
  poll_interval: z.number().int().optional().describe('Seconds between polls, default 2'),
});

export async function registerImapTools(server: McpServer, cfg?: AppConfig): Promise<void> {
  const c = cfg || appConfig;

  // list_folders
  server.registerTool(
    'list_folders',
    {
      title: 'List IMAP Folders',
      description: 'List all IMAP mailboxes/folders in the account',
      inputSchema: listFoldersParams,
    },
    async (params) => {
      try {
        const result = await listFolders(c, params as { folder_pattern?: string; include_subfolders?: boolean });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // search_emails
  server.registerTool(
    'search_emails',
    {
      title: 'Search Emails',
      description: 'Search emails by criteria, returning paginated results',
      inputSchema: searchEmailsParams,
    },
    async (params) => {
      try {
        const result = await searchEmails(c, params as {
          folder?: string;
          from?: string;
          to?: string;
          subject?: string;
          date_from?: string;
          date_to?: string;
          keyword?: string;
          unread_only?: boolean;
          limit?: number;
          offset?: number;
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // get_email_body
  server.registerTool(
    'get_email_body',
    {
      title: 'Get Email Body',
      description: 'Fetch only the body (text and/or HTML) of an email',
      inputSchema: getEmailBodyParams,
    },
    async (params) => {
      try {
        const result = await getEmailBody(c, params as {
          uid: number;
          folder?: string;
          text_only?: boolean;
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // get_email_headers
  server.registerTool(
    'get_email_headers',
    {
      title: 'Get Email Headers',
      description: 'Fetch only email headers - minimal bandwidth, no body download',
      inputSchema: getEmailHeadersParams,
    },
    async (params) => {
      try {
        const result = await getEmailHeaders(c, params as {
          uid: number;
          folder?: string;
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // mark_as_read
  server.registerTool(
    'mark_as_read',
    {
      title: 'Mark as Read',
      description: 'Mark messages as read or unread using IMAP FLAGS',
      inputSchema: markAsReadParams,
    },
    async (params) => {
      try {
        const result = await markAsRead(c, params as {
          uid: number;
          read?: boolean;
          folder?: string;
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // move_email
  server.registerTool(
    'move_email',
    {
      title: 'Move Email',
      description: 'Move an email to a different IMAP folder',
      inputSchema: moveEmailParams,
    },
    async (params) => {
      try {
        const result = await moveEmail(c, params as {
          uid: number;
          from_folder?: string;
          to_folder: string;
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // delete_email
  server.registerTool(
    'delete_email',
    {
      title: 'Delete Email',
      description: 'Delete an email (move to Trash folder)',
      inputSchema: deleteEmailParams,
    },
    async (params) => {
      try {
        const result = await deleteEmail(c, params as {
          uid: number;
          folder?: string;
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // create_folder
  server.registerTool(
    'create_folder',
    {
      title: 'Create Folder',
      description: 'Create a new IMAP mailbox folder',
      inputSchema: createFolderParams,
    },
    async (params) => {
      try {
        const result = await createFolder(c, params as {
          folder_name: string;
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // list_unread
  server.registerTool(
    'list_unread',
    {
      title: 'List Unread Messages',
      description: 'Quick listing of unread messages with pagination',
      inputSchema: listUnreadParams,
    },
    async (params) => {
      try {
        const result = await listUnread(c, params as {
          folder?: string;
          limit?: number;
          offset?: number;
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // email_waiting
  server.registerTool(
    'email_waiting',
    {
      title: 'Email Waiting (Polling)',
      description: 'Poll a mailbox repeatedly until an email matching conditions is found or timeout elapses',
      inputSchema: emailWaitingParams,
    },
    async (params) => {
      try {
        const result = await emailWaiting(c, params as {
          folder?: string;
          conditions?: {
            from?: string;
            to?: string;
            subject?: string;
            date_from?: string;
            date_to?: string;
            keyword?: string;
            unread_only?: boolean;
          };
          timeout?: number;
          poll_interval?: number;
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
