import { config as appConfig, type AppConfig } from '../config.js';
import { getImapClient } from '../connection.js';
import { CreateFolderResponseSchema, type CreateFolderResponse } from '../schema.js';

/**
 * Create a new IMAP mailbox folder.
 * Supports hierarchical names like "Work/Projects".
 */
export async function createFolder(
  credentials: AppConfig,
  opts: {
    folder_name: string;
  }
): Promise<CreateFolderResponse> {
  const cfg = credentials;
  const client = await getImapClient(cfg);

  const folderName = opts.folder_name;

  try {
    await client.mailboxCreate(folderName);
    return {
      name: folderName,
      created: true,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // If folder already exists, return created=false
    if (message.includes('exists') || message.includes('already')) {
      return {
        name: folderName,
        created: false,
      };
    }
    throw err;
  }
}
