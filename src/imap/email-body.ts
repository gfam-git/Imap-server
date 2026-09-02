import { config as appConfig, type AppConfig } from '../config.js';
import { getImapClient } from '../connection.js';
import { getConverter } from '../markdown.js';
import { EmailBodyResponseSchema, type EmailBodyResponse } from '../schema.js';

export async function getEmailBody(
  credentials: AppConfig,
  opts: {
    uid: number;
    folder?: string
  }
): Promise<EmailBodyResponse> {
  const cfg = credentials;
  const client = await getImapClient(cfg);
  const converter = getConverter();

  const folder = opts.folder || 'INBOX';
  await client.mailboxOpen(folder);

  // Fetch only source (body), not headers
  const msg = await client.fetchOne(opts.uid, {
    uid: true,
    source: { maxLength: 50000 },
  });

  const result: EmailBodyResponse = {};

  if (msg && 'source' in msg && msg.source) {
    result.body = await parseEmailSource(msg.source, false).then((parsed) => {
      // return JSON.stringify(msg.bodyStructure, null, 2);
      return msg.source?.toString('binary');

      // if (parsed.html) {
      //   return converter.translate(parsed.html);
      // } else if (parsed.text) {
      //   return parsed.text;
      // } else {
      //   return '';
      // }
    });
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
