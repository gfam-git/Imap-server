import { McpServer } from '@modelcontextprotocol/server';
import { config as appConfig, type AppConfig } from '../config.js';
import { sendEmail } from './send-email.js';
import { sendEmailWithAttachment } from './send-with-attach.js';
import { listDrafts, saveAsDraft, deleteDraft } from './drafts.js';
import { z } from 'zod';

// Tool parameter schemas (Zod)

const sendEmailParams = z.object({
  to: z.union([z.string(), z.array(z.string())]).describe('Recipient(s)'),
  subject: z.string().describe('Email subject'),
  body: z.string().describe('Email body (supports HTML)'),
  html: z.string().optional().describe('Optional HTML body (if body is plain text)'),
  from: z.string().optional().describe('Override sender, uses config default'),
  cc: z.array(z.string()).optional().describe('CC recipients'),
  bcc: z.array(z.string()).optional().describe('BCC recipients'),
});

const sendWithAttachParams = z.object({
  to: z.union([z.string(), z.array(z.string())]).describe('Recipient(s)'),
  subject: z.string().describe('Email subject'),
  body: z.string().describe('Email body'),
  attachments: z
    .array(
      z.object({
        name: z.string().describe('Attachment file name'),
        content: z.string().describe('Attachment content as base64 string'),
        content_type: z.string().describe('MIME content type'),
      })
    )
    .describe('List of file attachments'),
  from: z.string().optional().describe('Override sender, uses config default'),
  cc: z.array(z.string()).optional().describe('CC recipients'),
});

const listDraftsParams = z.object({
  folder: z.string().optional().describe('Drafts folder name, default "Drafts"'),
  limit: z.number().int().optional().describe('Max results'),
});

const saveAsDraftParams = z.object({
  subject: z.string().describe('Draft subject'),
  body: z.string().describe('Draft body (plain text)'),
  to: z.array(z.string()).optional().describe('Recipients'),
  cc: z.array(z.string()).optional().describe('CC recipients'),
  html: z.string().optional().describe('Optional HTML body'),
});

const deleteDraftParams = z.object({
  uid: z.number().int().positive().describe('Draft UID'),
  folder: z.string().optional().describe('Drafts folder'),
});

export async function registerSmtpTools(server: McpServer, cfg?: AppConfig): Promise<void> {
  const c = cfg || appConfig;

  // send_email
  server.registerTool(
    'send_email',
    {
      title: 'Send Email',
      description: 'Send an email with text or HTML body',
      inputSchema: sendEmailParams,
    },
    async (params) => {
      try {
        const result = await sendEmail(c, params as {
          to: string | string[];
          subject: string;
          body: string;
          html?: string;
          from?: string;
          cc?: string[];
          bcc?: string[];
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

  // send_email_with_attachment
  server.registerTool(
    'send_email_with_attachment',
    {
      title: 'Send Email with Attachment',
      description: 'Send an email with file attachments',
      inputSchema: sendWithAttachParams,
    },
    async (params) => {
      try {
        const result = await sendEmailWithAttachment(c, params as {
          to: string | string[];
          subject: string;
          body: string;
          attachments: { name: string; content: string; content_type: string }[];
          from?: string;
          cc?: string[];
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

  // list_drafts
  server.registerTool(
    'list_drafts',
    {
      title: 'List Drafts',
      description: 'List draft emails in the Drafts folder',
      inputSchema: listDraftsParams,
    },
    async (params) => {
      try {
        const result = await listDrafts(c, params as {
          folder?: string;
          limit?: number;
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

  // save_as_draft
  server.registerTool(
    'save_as_draft',
    {
      title: 'Save as Draft',
      description: 'Save an email as a draft',
      inputSchema: saveAsDraftParams,
    },
    async (params) => {
      try {
        const result = await saveAsDraft(c, params as {
          subject: string;
          body: string;
          to?: string[];
          cc?: string[];
          html?: string;
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

  // delete_draft
  server.registerTool(
    'delete_draft',
    {
      title: 'Delete Draft',
      description: 'Delete a draft email',
      inputSchema: deleteDraftParams,
    },
    async (params) => {
      try {
        const result = await deleteDraft(c, params as {
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
}
