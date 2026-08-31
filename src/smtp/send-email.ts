import nodemailer from 'nodemailer';
import { AppConfig } from '../config.js';
import { getSmtpTransport } from '../connection.js';

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  from?: string;
  cc?: string[];
  bcc?: string[];
}

export interface SendEmailResponse {
  message_id: string;
  status: string;
}

export async function sendEmail(
  cfg: AppConfig,
  params: SendEmailParams
): Promise<SendEmailResponse> {
  const transport = getSmtpTransport(cfg);

  const from = params.from || `${cfg.smtp.user}`;
  const to = Array.isArray(params.to) ? params.to : [params.to];

  const mailOptions: nodemailer.SendMailOptions = {
    from,
    to,
    subject: params.subject,
    text: params.body,
  };

  if (params.html) {
    mailOptions.html = params.html;
  }

  if (params.cc && params.cc.length > 0) {
    mailOptions.cc = params.cc;
  }

  if (params.bcc && params.bcc.length > 0) {
    mailOptions.bcc = params.bcc;
  }

  const info = await transport.sendMail(mailOptions);
  return {
    message_id: info.messageId || '',
    status: 'sent',
  };
}
