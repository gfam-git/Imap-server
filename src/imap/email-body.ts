import { config as appConfig, type AppConfig } from '../config.js';
import { getImapClient } from '../connection.js';
import { getConverter } from '../markdown.js';
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

  // Fetch full source (headers + body)
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
    // Build Markdown body from parsed data
    const markdown = buildMarkdownBody(parsed);
    if (markdown) {
      result.body = markdown;
    }
  }

  await client.mailboxClose();
  return result;
}

interface ParsedEmail {
  subject?: string;
  from?: string;
  fromAddress?: string;
  date?: string;
  text?: string;
  html?: string;
}

interface ParsedHeaders {
  subject?: string;
  from?: string;
  fromAddress?: string;
  date?: string;
}

async function parseEmailSource(
  source: Buffer,
  textOnly: boolean
): Promise<ParsedEmail> {
  const parsed: ParsedEmail = {};

  // First pass: extract headers
  const raw = source.toString('binary');
  const headerEndIndex = raw.indexOf('\r\n\r\n');
  const headerSection = headerEndIndex >= 0 ? raw.substring(0, headerEndIndex) : raw;
  const bodySection = headerEndIndex >= 0 ? raw.substring(headerEndIndex + 4) : '';

  // Parse headers
  const headers: ParsedHeaders = {};
  const headerLines = headerSection.split('\r\n').filter(l => l.trim());

  // Handle folded headers (continuation lines start with space/tab)
  let foldedHeaders: string[] = [];
  for (const line of headerLines) {
    if (/^\s/.test(line) && foldedHeaders.length > 0) {
      foldedHeaders[foldedHeaders.length - 1] += ' ' + line.trim();
    } else {
      foldedHeaders.push(line);
    }
  }

  for (const h of foldedHeaders) {
    const colonIdx = h.indexOf(':');
    if (colonIdx === -1) continue;
    const name = h.substring(0, colonIdx).trim().toLowerCase();
    const value = h.substring(colonIdx + 1).trim();

    if (name === 'subject') {
      headers.subject = decodeHeader(value);
    } else if (name === 'from') {
      headers.fromAddress = extractEmailAddress(value);
      headers.from = extractFromDisplay(value);
    } else if (name === 'date') {
      headers.date = value;
    }
  }

  parsed.subject = headers.subject;
  parsed.from = headers.from;
  parsed.fromAddress = headers.fromAddress;
  parsed.date = headers.date;

  // Second pass: extract body content
  const textParts: string[] = [];
  const htmlParts: string[] = [];
  let currentContentType = '';

  const lines = bodySection.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

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

  parsed.text = textParts.length > 0 ? textParts.join('\n') : undefined;
  parsed.html = htmlParts.length > 0 ? htmlParts.join('\n') : undefined;

  return parsed;
}

function decodeHeader(header: string): string {
  // Decode RFC 2047 encoded words: =?charset?encoding?encoded_text?=
  let result = header;
  const encodedRegex = /=\?([^?]+)\?([QqBb])\?([^?]*)\?=/g;
  result = result.replace(encodedRegex, (_, charset, encoding, encoded) => {
    if (encoding.toUpperCase() === 'B') {
      try {
        return Buffer.from(encoded, 'base64').toString('utf-8');
      } catch {
        return encoded;
      }
    }
    if (encoding.toUpperCase() === 'Q') {
      try {
        return Buffer.from(encoded.replace(/_/g, ' '), 'utf-8').toString('utf-8');
      } catch {
        return encoded;
      }
    }
    return encoded;
  });
  return result;
}

function extractEmailAddress(fromHeader: string): string {
  // Extract email address from "Name <email>" or <email>
  const match = fromHeader.match(/<([^>]+)>/);
  return match ? match[1] : '';
}

function extractFromDisplay(fromHeader: string): string {
  // Extract display name from "Name <email>" or just the raw header
  const match = fromHeader.match(/"([^"]+)"\s*</);
  if (match) {
    return match[1];
  }
  // Try angle-bracket only: <email>
  const bracketMatch = fromHeader.match(/^<([^>]+)>$/);
  if (bracketMatch) {
    return bracketMatch[1];
  }
  return fromHeader;
}

function buildMarkdownBody(parsed: ParsedEmail): string {
  const parts: string[] = [];

  // Title line
  if (parsed.subject) {
    parts.push(`# ${parsed.subject}`);
  }

  // From line
  const fromDisplay = parsed.from || parsed.fromAddress || 'unknown';
  const fromAddress = parsed.fromAddress || '';
  const dateStr = parsed.date || '';

  let fromLine = `_From ${fromDisplay}`;
  if (fromAddress) {
    fromLine += ` <${fromAddress}>`;
  }
  if (dateStr) {
    fromLine += ` on ${dateStr}`;
  }
  fromLine += `_`;
  parts.push(fromLine);

  // Body separator
  parts.push('');

  // Body content - use the remote branch's markdown converter
  const converter = getConverter();
  let bodyContent = '';

  if (parsed.html) {
    bodyContent = converter.translate(parsed.html);
  }
  if (!bodyContent && parsed.text) {
    bodyContent = parsed.text;
  }

  if (bodyContent) {
    parts.push(bodyContent);
  }

  return parts.join('\n\n');
}
