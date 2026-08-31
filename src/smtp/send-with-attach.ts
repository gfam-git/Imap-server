import nodemailer from 'nodemailer';
import { AppConfig } from '../config.js';
import { getSmtpTransport } from '../connection.js';

export interface Attachment {
  name: string;
  content: string;
  content_type: string;
}

export interface SendWithAttachParams {
  to: string | string[];
  subject: string;
  body: string;
  attachments: Attachment[];
  from?: string;
  cc?: string[];
}

export interface SendWithAttachResponse {
  message_id: string;
  status: string;
  attachments_sent: number;
}

export async function sendEmailWithAttachment(
  cfg: AppConfig,
  params: SendWithAttachParams
): Promise<SendWithAttachResponse> {
  const transport = getSmtpTransport(cfg);

  const from = params.from || `${cfg.smtp.user}`;
  const to = Array.isArray(params.to) ? params.to : [params.to];

  const mailOptions: nodemailer.SendMailOptions = {
    from,
    to,
    subject: params.subject,
    text: params.body,
  };

  if (params.cc && params.cc.length > 0) {
    mailOptions.cc = params.cc;
  }

  if (params.attachments && params.attachments.length > 0) {
    mailOptions.attachments = params.attachments.map((att) => ({
      filename: att.name,
      content: Buffer.from(att.content, 'base64'),
      contentType: att.content_type,
    }));
  }

  const info = await transport.sendMail(mailOptions);
  return {
    message_id: info.messageId || '',
    status: 'sent',
    attachments_sent: params.attachments ? params.attachments.length : 0,
  };
}
