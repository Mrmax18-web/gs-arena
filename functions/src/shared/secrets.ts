import { defineSecret } from 'firebase-functions/params';

export const creatorAccessCode = defineSecret('CREATOR_ACCESS_CODE');
export const smtpHost = defineSecret('SMTP_HOST');
export const smtpPort = defineSecret('SMTP_PORT');
export const smtpUser = defineSecret('SMTP_USER');
export const smtpPass = defineSecret('SMTP_PASS');
export const mailFrom = defineSecret('MAIL_FROM');

export const ALL_SECRETS = [
  creatorAccessCode,
  smtpHost,
  smtpPort,
  smtpUser,
  smtpPass,
  mailFrom,
];
