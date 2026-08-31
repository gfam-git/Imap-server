import { config as appConfig, type AppConfig } from '../config.js';
import { getImapClient } from '../connection.js';
import { ReadFlagResponseSchema, type ReadFlagResponse } from '../schema.js';

/**
 * Mark a message as read or unread using IMAP SETFLAG/STORE.
 */
export async function markAsRead(
  credentials: AppConfig,
  opts: {
    uid: number;
    read?: boolean;
    folder?: string;
  }
): Promise<ReadFlagResponse> {
  const cfg = credentials;
  const client = await getImapClient(cfg);

  const folder = opts.folder || 'INBOX';
  await client.mailboxOpen(folder);

  const read = opts.read !== false;

  if (read) {
    // Mark as read (add \\Seen flag)
    await client.messageFlagsAdd(opts.uid, ['\\Seen']);
  } else {
    // Mark as unread (remove \\Seen flag)
    await client.messageFlagsRemove(opts.uid, ['\\Seen']);
  }

  await client.mailboxClose();

  return {
    uid: opts.uid,
    read,
  };
}
