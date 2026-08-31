import { config as appConfig, type AppConfig } from '../config.js';
import { getImapClient } from '../connection.js';
import { ListFoldersResponseSchema, type ListFoldersResponse } from '../schema.js';

export async function listFolders(
  credentials: AppConfig,
  opts?: { folder_pattern?: string; include_subfolders?: boolean }
): Promise<ListFoldersResponse> {
  const cfg = credentials;
  const client = await getImapClient(cfg);

  const folders = await client.list();

  const result: ListFoldersResponse = {
    folders: folders.map((f) => ({
      name: f.path || f.name || '',
      delimiter: f.delimiter || '.',
      flags: Array.from(f.flags || []),
    })),
  };

  return result;
}
