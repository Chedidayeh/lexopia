import "server-only";

import nodemailer from "nodemailer";

let cachedTransport: ReturnType<typeof nodemailer.createTransport> | null = null;
let cachedFromAddress: string | null = null;

function getEnvNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildTransport() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (smtpHost && smtpUser && smtpPass) {
    return {
      transport: nodemailer.createTransport({
        host: smtpHost,
        port: getEnvNumber(process.env.SMTP_PORT, 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: smtpUser, pass: smtpPass },
      }),
      fromAddress: process.env.MAIL_FROM ?? smtpUser,
    };
  }

  if (gmailUser && gmailPass) {
    return {
      transport: nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
      }),
      fromAddress: process.env.MAIL_FROM ?? gmailUser,
    };
  }

  return null;
}

function getMailConfig() {
  if (!cachedTransport || !cachedFromAddress) {
    const config = buildTransport();
    if (!config) {
      return null;
    }

    cachedTransport = config.transport;
    cachedFromAddress = config.fromAddress;
  }

  return {
    transport: cachedTransport,
    fromAddress: cachedFromAddress,
  };
}

export function isMailConfigured(): boolean {
  return getMailConfig() !== null;
}

export async function sendMail(params: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const config = getMailConfig();
  if (!config) {
    throw new Error("Mail transport is not configured");
  }

  return config.transport.sendMail({
    from: config.fromAddress,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
  });
}