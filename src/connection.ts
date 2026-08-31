import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import { config as appConfig, AppConfig } from './config.js';

let imapClient: ImapFlow | null = null;
let smtpTransport: nodemailer.Transporter | null = null;

export async function getImapClient(cfg?: AppConfig): Promise<ImapFlow> {
  const c = cfg || appConfig;
  if (!imapClient) {
    imapClient = new ImapFlow({
      host: c.imap.host,
      port: c.imap.port,
      secure: c.imap.tls,
      auth: {
        user: c.imap.user,
        pass: c.imap.password,
      },
      tls: {
        rejectUnauthorized: false,
      },
      clientInfo: {
        name: 'imap-mcp',
        version: '0.1.0',
      },
    });
    await imapClient.connect();
  }
  return imapClient;
}

export function getSmtpTransport(cfg?: AppConfig): nodemailer.Transporter {
  const c = cfg || appConfig;
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: c.smtp.host,
      port: c.smtp.port,
      secure: c.smtp.secure,
      auth: c.smtp.user
        ? {
            user: c.smtp.user,
            pass: c.smtp.password,
          }
        : undefined,
    });
  }
  return smtpTransport;
}

export async function closeConnections(): Promise<void> {
  if (imapClient) {
    try {
      await imapClient.close();
    } catch {
      // Ignore close errors
    }
    imapClient = null;
  }
  smtpTransport = null;
}
