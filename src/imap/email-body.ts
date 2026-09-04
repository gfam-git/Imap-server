import { MessageStructureObject } from 'imapflow';
import { config as appConfig, type AppConfig } from '../config.js';
import { getImapClient } from '../connection.js';
import { getConverter } from '../markdown.js';
import { EmailBodyResponseSchema, type EmailBodyResponse } from '../schema.js';

export async function getEmailBody(
  credentials: AppConfig,
  opts: {
    uid: number;
    folder?: string;
    text_only?: boolean;
  }
): Promise<EmailBodyResponse> {
  const cfg = credentials;
  const client = await getImapClient(cfg);
  const converter = getConverter();

  const folder = opts.folder || 'INBOX';
  await client.mailboxOpen(folder);

  // Fetch full source (headers + body)
  const msg = await client.fetchOne(opts.uid, {
    uid: true,
    envelope: true,
    bodyStructure: true
  }, {uid: true});

  await client.mailboxClose();

  if (!msg) {
    return {
      success: false,
      message: `Email with UID ${opts.uid} not found in folder ${folder}.`
    };
  }

  const subject = msg.envelope?.subject;
  if (!subject) {
    return {
      success: false,
      message: `Email with UID ${opts.uid} is not valid. No subject.`
    };
  }

  const from = msg.envelope?.from?.map(f => `${f.name} <${f.address}>`).join(', ');
  const to = msg.envelope?.to?.map(t => `${t.name} <${t.address}>`).join(', ');
  const date = msg.envelope?.date?.toISOString();
  if (!from && !to && !date) {
    return {
      success: false,
      message: `Email with UID ${opts.uid} is not valid. No from, to, or date.`
    };
  }

  if (!msg.bodyStructure) {
    return {
      success: false,
      message: `Email with UID ${opts.uid} is not valid. No body stucture.`
    }
  }

  const contentType = msg.bodyStructure?.type;
  if (!contentType) {
    return {
      success: false,
      message: `Email with UID ${opts.uid} is not valid. No content type.`
    };
  }

  const children = msg.bodyStructure?.childNodes;
  let usePart: MessageStructureObject | null = null;

  if (msg.bodyStructure?.part) {
    usePart = msg.bodyStructure;
  }
  else if (children) {
    const htmlChild = children.filter(child => child.type.toLowerCase().includes('html'))[0] || null;
    if (!htmlChild) {
      usePart = children[0];
    }
    else {
      usePart = htmlChild;
    }
  }

  if (!usePart || !usePart.part) {
    return {
      success: false,
      message: `Email with UID ${opts.uid} is not valid. No body.`
    };
  }

  await client.mailboxOpen(folder);

  const partMessage = await client.fetchOne(opts.uid, {
    bodyParts: [usePart.part]
  }, {uid: true})

  await client.mailboxClose();

  if (!partMessage) {
    return {
      success: false,
      message: `Email with UID ${opts.uid} is not valid. No body.`
    };
  }

  const body = partMessage.bodyParts?.get(usePart.part)?.toString();
  const markdown = `# ${subject}
_Sent${from ? ` from ${from}` : ''}${to ? ` to ${to}` : ''}${date ? ` on ${date}` : ''}_

---

${body ? converter.translate(body) : ''}` 

  return {
    success: true,
    body: markdown
  };
}