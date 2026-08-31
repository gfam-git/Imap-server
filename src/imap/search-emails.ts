import { config as appConfig, type AppConfig } from '../config.js';
import { getImapClient } from '../connection.js';
import { SearchEmailsResponseSchema, type SearchEmailsResponse } from '../schema.js';

export async function searchEmails(
  credentials: AppConfig,
  opts: {
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
  }
): Promise<SearchEmailsResponse> {
  const cfg = credentials;
  const client = await getImapClient(cfg);

  const folder = opts.folder || 'INBOX';
  await client.mailboxOpen(folder);

  // Build ImapFlow search query
  const searchQuery: {
    from?: string;
    to?: string;
    subject?: string;
    body?: string;
    text?: string;
    seen?: boolean;
    since?: string;
    before?: string;
  } = {};

  if (opts.unread_only) {
    searchQuery.seen = false;
  }
  if (opts.from) {
    searchQuery.from = opts.from;
  }
  if (opts.to) {
    searchQuery.to = opts.to;
  }
  if (opts.subject) {
    searchQuery.subject = opts.subject;
  }
  if (opts.keyword) {
    searchQuery.text = opts.keyword;
  }
  if (opts.date_from) {
    searchQuery.since = opts.date_from;
  }
  if (opts.date_to) {
    searchQuery.before = opts.date_to;
  }

  // Search for message UIDs
  const uidsResult = await client.search(searchQuery, { uid: true });
  const uids = uidsResult === false ? [] : uidsResult;

  // Get total count
  const total = uids.length;

  // Fetch envelope info for matching messages
  const limit = opts.limit || 50;
  const offset = opts.offset || 0;
  const slicedUids = uids.slice(offset, offset + limit);

  const results: Array<{ uid: number; subject: string; from: string; date: string; message_id: string; snippet: string }> = [];
  for (const uid of slicedUids) {
    try {
      const msg = await client.fetchOne(uid, {
        uid: true,
        envelope: true,
        source: { maxLength: 500 },
      });
      if (!msg) {
        results.push({ uid, subject: '(fetch error)', from: '', date: '', message_id: '', snippet: '' });
        continue;
      }
      const fromAddr = msg.envelope?.from?.[0];
      const from = fromAddr?.name ? `${fromAddr.name} <${fromAddr.address}>` : fromAddr?.address || '';
      const snippet = msg.source ? msg.source.toString().slice(0, 200) : '';

      results.push({
        uid: msg.uid || uid,
        subject: msg.envelope?.subject || '(no subject)',
        from,
        date: msg.envelope?.date ? msg.envelope.date.toISOString() : '',
        message_id: msg.envelope?.messageId || '',
        snippet,
      });
    } catch {
      results.push({ uid, subject: '(fetch error)', from: '', date: '', message_id: '', snippet: '' });
    }
  }

  await client.mailboxClose();

  const result: SearchEmailsResponse = {
    total,
    results,
  };

  return result;
}
