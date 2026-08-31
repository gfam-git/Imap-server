import { config as appConfig, type AppConfig } from '../config.js';
import { getImapClient } from '../connection.js';
import { FetchEmailResponseSchema, type FetchEmailResponse } from '../schema.js';

export async function fetchEmail(
  credentials: AppConfig,
  opts: {
    uid: number;
    folder?: string;
    include_body?: boolean;
    include_attachments?: boolean;
  }
): Promise<FetchEmailResponse> {
  const cfg = credentials;
  const client = await getImapClient(cfg);

  const folder = opts.folder || 'INBOX';
  await client.mailboxOpen(folder);

  const msg = await client.fetchOne(opts.uid, {
    uid: true,
    envelope: true,
    source: opts.include_body !== false ? { maxLength: 50000 } : undefined,
    bodyStructure: true,
  });

  if (!msg) {
    await client.mailboxClose();
    throw new Error(`Message UID ${opts.uid} not found`);
  }

  // Build from address
  const fromAddr = msg.envelope?.from?.[0];
  const from = {
    address: fromAddr?.address || '',
    name: fromAddr?.name || '',
  };

  // Build to addresses
  const to = (msg.envelope?.to || []).map((a: { address?: string; name?: string }) => ({
    address: a.address || '',
    name: a.name || '',
  }));

  // Build cc addresses
  const cc = (msg.envelope?.cc || []).map((a: { address?: string; name?: string }) => ({
    address: a.address || '',
    name: a.name || '',
  }));

  const result: FetchEmailResponse = {
    uid: msg.uid || opts.uid,
    subject: msg.envelope?.subject || '',
    from,
    to,
    cc: cc.length > 0 ? cc : undefined,
    date: msg.envelope?.date ? msg.envelope.date.toISOString() : '',
    message_id: msg.envelope?.messageId || '',
  };

  // Parse body from source if requested
  if (opts.include_body !== false && msg.source) {
    const parsed = await parseEmailSource(msg.source);
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

// Minimal MIME parser - parses email source buffer into text/html
async function parseEmailSource(source: Buffer): Promise<{ text?: string; html?: string }> {
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

    // Simple heuristic: check if content type is text/plain or text/html
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

    if (currentContentType === 'text/plain') {
      textParts.push(line);
    } else if (currentContentType === 'text/html') {
      htmlParts.push(line);
    }
  }

  return {
    text: textParts.length > 0 ? textParts.join('\n') : undefined,
    html: htmlParts.length > 0 ? htmlParts.join('\n') : undefined,
  };
}
