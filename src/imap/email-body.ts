import { config as appConfig, type AppConfig } from '../config.js';
import { getImapClient } from '../connection.js';
import { EmailBodyResponseSchema, type EmailBodyResponse } from '../schema.js';

export async function getEmailBody(
  credentials: AppConfig,
  opts: {
    uid: number;
    folder?: string;
    text_only?: boolean;
  }
): Promise<EmailBodyResponse> {
  const cfg = credentials;
  const client = await getImapClient(cfg);

  const folder = opts.folder || 'INBOX';
  await client.mailboxOpen(folder);

  // Fetch only source (body), not headers
  const msg = await client.fetchOne(opts.uid, {
    uid: true,
    source: { maxLength: 50000 },
  });

  const result: EmailBodyResponse = {};

  if (msg && 'source' in msg && msg.source) {
    const parsed = await parseEmailSource(msg.source, opts.text_only ?? false);
    if (parsed.text) {
      result.body_text = parsed.text;
    }
    if (parsed.html) {
      result.body_html = parsed.html;
    }
  }

  await client.mailboxClose();
  return result;
}

async function parseEmailSource(
  source: Buffer,
  textOnly: boolean
): Promise<{ text?: string; html?: string }> {
  const textParts: string[] = [];
  const htmlParts: string[] = [];
  let currentContentType = '';
  let headerEnd = false;

  const lines = source.toString('binary').split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect header/body separator
    if (!headerEnd && (line === '\r' || line === '')) {
      headerEnd = true;
      continue;
    }

    if (!headerEnd) continue;

    const lowerLine = line.toLowerCase();
    if (currentContentType === '' && lowerLine.includes('content-type')) {
      if (lowerLine.includes('text/plain')) {
        currentContentType = 'text/plain';
      } else if (lowerLine.includes('text/html')) {
        currentContentType = 'text/html';
      }
    }

    // Check for multipart boundary
    if (currentContentType.includes('multipart') && (line.startsWith('--') || line.startsWith('\r--'))) {
      if (currentContentType.includes('text/html')) {
        htmlParts.push('');
      } else {
        textParts.push('');
      }
      currentContentType = '';
      continue;
    }

    if (textOnly && currentContentType === 'text/html') {
      continue;
    }

    if (currentContentType === 'text/plain') {
      textParts.push(line);
    } else if (currentContentType === 'text/html' && !textOnly) {
      htmlParts.push(line);
    }
  }

  return {
    text: textParts.length > 0 ? textParts.join('\n') : undefined,
    html: htmlParts.length > 0 ? htmlParts.join('\n') : undefined,
  };
}
