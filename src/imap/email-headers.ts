import { config as appConfig, type AppConfig } from '../config.js';
import { getImapClient } from '../connection.js';
import { EmailHeadersResponseSchema, type EmailHeadersResponse } from '../schema.js';

export async function getEmailHeaders(
  credentials: AppConfig,
  opts: {
    uid: number;
    folder?: string;
  }
): Promise<EmailHeadersResponse> {
  const cfg = credentials;
  const client = await getImapClient(cfg);

  const folder = opts.folder || 'INBOX';
  await client.mailboxOpen(folder);

  // Fetch envelope + headers only, no body
  const msg = await client.fetchOne(opts.uid, {
    uid: true,
    envelope: true,
    headers: true,
  });

  if (!msg) {
    await client.mailboxClose();
    throw new Error(`Message UID ${opts.uid} not found`);
  }

  const headers: Record<string, string> = {};
  if (msg.headers) {
    // headers is a Buffer of raw header lines
    const raw = msg.headers.toString();
    const lines = raw.split('\n');
    let currentKey = '';
    let currentValue = '';
    for (const line of lines) {
      const trimmed = line.trimEnd();
      if (!trimmed) continue;
      // Continuation line (folded headers)
      if (trimmed[0] === ' ' || trimmed[0] === '\t') {
        currentValue += ' ' + trimmed.trimStart();
      } else {
        if (currentKey) {
          headers[currentKey.toLowerCase()] = currentValue.trim();
        }
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx > 0) {
          currentKey = trimmed.slice(0, colonIdx);
          currentValue = trimmed.slice(colonIdx + 1).trim();
        }
      }
    }
    if (currentKey) {
      headers[currentKey.toLowerCase()] = currentValue.trim();
    }
  }

  const result: EmailHeadersResponse = {
    subject: msg.envelope?.subject || '',
    from: formatAddress(msg.envelope?.from?.[0]),
    to: formatAddresses(msg.envelope?.to),
    cc: msg.envelope?.cc ? formatAddresses(msg.envelope.cc) : undefined,
    date: msg.envelope?.date ? msg.envelope.date.toISOString() : '',
    message_id: msg.envelope?.messageId || '',
    in_reply_to: msg.envelope?.inReplyTo,
    headers,
  };

  await client.mailboxClose();
  return result;
}

function formatAddress(addr: { name?: string; address?: string } | undefined): string {
  if (!addr || !addr.address) return '';
  if (addr.name) return `${addr.name} <${addr.address}>`;
  return addr.address;
}

function formatAddresses(addrs: { name?: string; address?: string }[] | undefined): string {
  if (!addrs || addrs.length === 0) return '';
  return addrs.map((a) => formatAddress(a)).join(', ');
}
