import * as nodemailer from 'nodemailer';
import { smtpHost, smtpPort, smtpUser, smtpPass, mailFrom } from '../shared/secrets.js';

export function isSmtpConfigured(): boolean {
  try {
    const host = process.env.SMTP_HOST || (smtpHost.value ? smtpHost.value() : '');
    const user = process.env.SMTP_USER || (smtpUser.value ? smtpUser.value() : '');
    const pass = process.env.SMTP_PASS || (smtpPass.value ? smtpPass.value() : '');
    return Boolean(host && user && pass);
  } catch {
    return false;
  }
}

export function getMailTransport(): nodemailer.Transporter | null {
  if (process.env.FUNCTIONS_EMULATOR === 'true' && !isSmtpConfigured()) {
    // Emulator logging transport
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  if (!isSmtpConfigured()) {
    return null;
  }

  const host = process.env.SMTP_HOST || smtpHost.value();
  const port = parseInt(process.env.SMTP_PORT || smtpPort.value() || '587', 10);
  const user = process.env.SMTP_USER || smtpUser.value();
  const pass = process.env.SMTP_PASS || smtpPass.value();

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendIndividualEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<boolean> {
  const transport = getMailTransport();
  if (!transport) {
    return false;
  }

  const fromAddress = process.env.MAIL_FROM || (mailFrom.value ? mailFrom.value() : 'noreply@tournamenttracker.pro');

  await transport.sendMail({
    from: `"Tournament Ops" <${fromAddress}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html || `<p>${options.text}</p>`,
  });

  return true;
}
