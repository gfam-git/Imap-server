import { AppConfig } from '../config.js';
import { getImapClient } from '../connection.js';

export interface ListDraftsParams {
  folder?: string;
  limit?: number;
}

export interface DraftItem {
  uid: number;
  subject: string;
  from: string;
  date: string;
}

export interface ListDraftsResponse {
  drafts: DraftItem[];
}

export interface SaveAsDraftParams {
  subject: string;
  body: string;
  to?: string[];
  cc?: string[];
  html?: string;
}

export interface SaveAsDraftResponse {
  uid: number;
  folder: string;
}

export interface DeleteDraftParams {
  uid: number;
  folder?: string;
}

export interface DeleteDraftResponse {
  uid: number;
  status: string;
}

export async function listDrafts(
  cfg: AppConfig,
  params: ListDraftsParams
): Promise<ListDraftsResponse> {
  const client = await getImapClient(cfg);
  const folder = params.folder || 'Drafts';

  await client.mailboxOpen(folder);

  const limit = params.limit || 50;
  const searchQuery = {};

  const uidsResult = await client.search(searchQuery, { uid: true });
  const uids = uidsResult === false ? [] : uidsResult;

  const slicedUids = uids.slice(0, limit);

  const drafts: DraftItem[] = [];
  for (const uid of slicedUids) {
    try {
      const msg = await client.fetchOne(uid, {
        uid: true,
        envelope: true,
        source: { maxLength: 200 },
      });
      if (!msg) {
        drafts.push({ uid, subject: '(fetch error)', from: '', date: '' });
        continue;
      }

      const fromAddr = msg.envelope?.from?.[0];
      const from = fromAddr?.name
        ? `${fromAddr.name} <${fromAddr.address}>`
        : fromAddr?.address || '';

      drafts.push({
        uid: msg.uid || uid,
        subject: msg.envelope?.subject || '(no subject)',
        from,
        date: msg.envelope?.date
          ? msg.envelope.date.toISOString()
          : '',
      });
    } catch {
      drafts.push({ uid, subject: '(fetch error)', from: '', date: '' });
    }
  }

  await client.mailboxClose();

  return { drafts };
}

export async function saveAsDraft(
  cfg: AppConfig,
  params: SaveAsDraftParams
): Promise<SaveAsDraftResponse> {
  const client = await getImapClient(cfg);
  const folder = 'Drafts';

  // Ensure Drafts folder exists
  try {
    await client.mailboxOpen(folder);
    await client.mailboxClose();
  } catch {
    await client.mailboxCreate(folder);
  }

  // Build RFC 5322 message
  let raw = '';
  raw += `From: ${cfg.smtp.user}\r\n`;
  raw += `To: ${params.to?.join(', ') || ''}\r\n`;
  if (params.cc && params.cc.length > 0) {
    raw += `Cc: ${params.cc.join(', ')}\r\n`;
  }
  raw += `Subject: ${params.subject}\r\n`;
  raw += `Date: ${new Date().toUTCString()}\r\n`;
  raw += `MIME-Version: 1.0\r\n`;

  if (params.html) {
    raw += `Content-Type: multipart/alternative; boundary="BOUNDARY"\r\n\r\n`;
    raw += `--BOUNDARY\r\n`;
    raw += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
    raw += `${params.body}\r\n`;
    raw += `--BOUNDARY\r\n`;
    raw += `Content-Type: text/html; charset="UTF-8"\r\n\r\n`;
    raw += `${params.html}\r\n`;
    raw += `--BOUNDARY--\r\n`;
  } else {
    raw += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
    raw += `${params.body}\r\n`;
  }

  const buffer = Buffer.from(raw);

  // APPEND the draft to the Drafts folder
  const appendResult = await client.append(folder, buffer);

  if (appendResult === false) {
    throw new Error('Failed to append draft to folder');
  }

  return {
    uid: (appendResult as { uid?: number }).uid ?? 0,
    folder,
  };
}

export async function deleteDraft(
  cfg: AppConfig,
  params: DeleteDraftParams
): Promise<DeleteDraftResponse> {
  const client = await getImapClient(cfg);
  const folder = params.folder || 'Drafts';

  await client.mailboxOpen(folder);

  // Mark the message as deleted and expunge
  await client.messageDelete(params.uid);

  await client.mailboxClose();

  return {
    uid: params.uid,
    status: 'deleted',
  };
}
