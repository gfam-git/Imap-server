import { config as appConfig, type AppConfig } from '../config.js';
import { getImapClient } from '../connection.js';
import { DeleteEmailResponseSchema, type DeleteEmailResponse } from '../schema.js';

/**
 * Delete an email by marking it as deleted and expunging.
 */
export async function deleteEmail(
  credentials: AppConfig,
  opts: {
    uid: number;
    folder?: string;
  }
): Promise<DeleteEmailResponse> {
  const cfg = credentials;
  const client = await getImapClient(cfg);

  const folder = opts.folder || 'INBOX';
  await client.mailboxOpen(folder);

  // Mark the message as deleted and expunge
  await client.messageDelete(opts.uid);

  await client.mailboxClose();

  return {
    uid: opts.uid,
    status: 'deleted',
  };
}
