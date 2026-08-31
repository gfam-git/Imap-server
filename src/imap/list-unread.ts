import { config as appConfig, type AppConfig } from '../config.js';
import { getImapClient } from '../connection.js';
import { ListUnreadResponseSchema, type ListUnreadResponse } from '../schema.js';

/**
 * List unread messages with pagination.
 */
export async function listUnread(
  credentials: AppConfig,
  opts: {
    folder?: string;
    limit?: number;
    offset?: number;
  }
): Promise<ListUnreadResponse> {
  const cfg = credentials;
  const client = await getImapClient(cfg);

  const folder = opts.folder || 'INBOX';
  const limit = opts.limit || 50;
  const offset = opts.offset || 0;

  await client.mailboxOpen(folder);

  // Search for unread messages (seen: false = unread)
  const searchResult = await client.search({ seen: false }, { uid: true });

  const totalUnread = Array.isArray(searchResult) ? searchResult.length : 0;

  if (!Array.isArray(searchResult)) {
    await client.mailboxClose();
    return { total_unread: 0, messages: [] };
  }

  // Sort descending (newest first by UID) and apply pagination
  const uids = searchResult.sort((a, b) => b - a);
  const page = uids.slice(offset, offset + limit);

  const messages: Array<{ uid: number; subject: string; from: string; date: string }> = [];

  for (const uid of page) {
    try {
      const msg = await client.fetchOne(uid, {
        uid: true,
        envelope: true,
      });

      if (msg && msg.envelope) {
        const fromAddr = msg.envelope.from?.[0];
        const from = fromAddr?.name ? `${fromAddr.name} <${fromAddr.address}>` : fromAddr?.address || '';

        messages.push({
          uid: msg.uid || uid,
          subject: msg.envelope.subject || '',
          from,
          date: msg.envelope.date ? msg.envelope.date.toISOString() : '',
        });
      }
    } catch {
      // Skip messages that can't be fetched
      continue;
    }
  }

  await client.mailboxClose();

  return {
    total_unread: totalUnread,
    messages,
  };
}
