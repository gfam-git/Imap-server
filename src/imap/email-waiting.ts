import { config as appConfig, type AppConfig } from '../config.js';
import { getImapClient } from '../connection.js';
import { EmailWaitingResponseSchema, type EmailWaitingResponse, SearchResultSchema } from '../schema.js';

/**
 * Poll a mailbox for emails matching given conditions until one is found or timeout elapses.
 *
 * @param credentials - IMAP credentials
 * @param opts - Options
 * @param opts.folder - IMAP folder to poll (default "INBOX")
 * @param opts.conditions - Search conditions (same schema as search_emails)
 * @param opts.timeout - Max seconds to wait (default 30)
 * @param opts.poll_interval - Seconds between polls (default 2)
 */
export async function emailWaiting(
  credentials: AppConfig,
  opts: {
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
  }
): Promise<EmailWaitingResponse> {
  const cfg = credentials;
  const folder = opts.folder || 'INBOX';
  const timeout = opts.timeout || 30;
  const pollInterval = opts.poll_interval || 2;

  const startTime = Date.now();
  const endTime = startTime + timeout * 1000;

  while (Date.now() < endTime) {
    const client = await getImapClient(cfg);

    try {
      await client.mailboxOpen(folder);

      // Build search query (same as searchEmails)
      const conditions = opts.conditions || {};
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

      if (conditions.unread_only) {
        searchQuery.seen = false;
      }
      if (conditions.from) {
        searchQuery.from = conditions.from;
      }
      if (conditions.to) {
        searchQuery.to = conditions.to;
      }
      if (conditions.subject) {
        searchQuery.subject = conditions.subject;
      }
      if (conditions.keyword) {
        searchQuery.text = conditions.keyword;
      }
      if (conditions.date_from) {
        searchQuery.since = conditions.date_from;
      }
      if (conditions.date_to) {
        searchQuery.before = conditions.date_to;
      }

      // Search for message UIDs
      const uidsResult = await client.search(searchQuery, { uid: true });
      const uids = uidsResult === false ? [] : uidsResult;

      if (uids.length > 0) {
        // Found a matching message - fetch the first one
        const uid = uids[uids.length - 1]; // newest by UID

        try {
          const msg = await client.fetchOne(uid, {
            uid: true,
            envelope: true,
            source: { maxLength: 500 },
          });

          if (msg) {
            const fromAddr = msg.envelope?.from?.[0];
            const from = fromAddr?.name ? `${fromAddr.name} <${fromAddr.address}>` : fromAddr?.address || '';

            const result: EmailWaitingResponse = {
              found: true,
              uid: msg.uid || uid,
              subject: msg.envelope?.subject || '(no subject)',
              from,
              date: msg.envelope?.date ? msg.envelope.date.toISOString() : '',
              body_text: msg.source ? msg.source.toString().slice(0, 500) : '',
            };

            await client.mailboxClose();
            return result;
          }
        } catch {
          // Fetch error - continue polling
        }
      }

      await client.mailboxClose();
    } catch {
      // Connection error - continue polling
      // Client will reconnect on next iteration
    }

    // Sleep before next poll
    const elapsed = Date.now() - startTime;
    const remaining = endTime - startTime - elapsed;
    const sleepMs = Math.min(pollInterval * 1000, remaining);

    if (sleepMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, sleepMs));
    }
  }

  // Timeout - no matching email found
  return {
    found: false,
    message: `Timeout after ${timeout} seconds: no matching email found in folder "${folder}"`,
  };
}
