import { config as appConfig, type AppConfig } from '../config.js';
import { getImapClient } from '../connection.js';
import { MoveEmailResponseSchema, type MoveEmailResponse } from '../schema.js';

/**
 * Move an email to a different IMAP folder.
 * Creates the destination folder if it does not exist.
 */
export async function moveEmail(
  credentials: AppConfig,
  opts: {
    uid: number;
    from_folder?: string;
    to_folder: string;
  }
): Promise<MoveEmailResponse> {
  const cfg = credentials;
  const client = await getImapClient(cfg);

  const fromFolder = opts.from_folder || 'INBOX';
  const toFolder = opts.to_folder;

  // Create destination folder if needed
  try {
    await client.mailboxCreate(toFolder);
  } catch {
    // Folder may already exist; ignore
  }

  // Open source folder
  await client.mailboxOpen(fromFolder);

  // Fetch the full message source as a buffer
  const msg = await client.fetchOne(opts.uid, { source: true });
  if (!msg || !msg.source) {
    await client.mailboxClose();
    throw new Error(`Message UID ${opts.uid} not found`);
  }

  // Open destination folder and append the message
  await client.mailboxOpen(toFolder);
  await client.append(toFolder, msg.source);

  // Mark the original as deleted and expunge
  await client.mailboxOpen(fromFolder);
  await client.messageDelete(opts.uid);

  await client.mailboxClose();

  return {
    uid: opts.uid,
    from: fromFolder,
    to: toFolder,
  };
}
