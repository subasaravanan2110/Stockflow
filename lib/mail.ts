import "server-only";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { env } from "@/lib/env";

type Mail = { to: string; subject: string; html: string; text?: string };
export type MailDelivery = { delivered: boolean };

export async function sendMail(message: Mail): Promise<MailDelivery> {
  const gmailUser = env.GMAIL_SMTP_USER.trim().toLowerCase();
  const gmailAppPassword = env.GMAIL_SMTP_APP_PASSWORD.replace(/\s/g, "");
  if (gmailUser || gmailAppPassword) {
    if (!gmailUser || !gmailAppPassword) {
      throw new Error("Gmail SMTP configuration is incomplete. Set both GMAIL_SMTP_USER and GMAIL_SMTP_APP_PASSWORD.");
    }
    if (!env.EMAIL_FROM.toLowerCase().includes(gmailUser)) {
      throw new Error("EMAIL_FROM must use the same Gmail address configured in GMAIL_SMTP_USER.");
    }
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailAppPassword },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
    await transporter.sendMail({ from: env.EMAIL_FROM, ...message });
    return { delivered: true };
  }

  if (!env.RESEND_API_KEY) {
    console.info(`[mail preview] ${message.subject} -> ${message.to}`);
    console.info(message.text ?? message.html.replace(/<[^>]+>/g, " "));
    return { delivered: false };
  }
  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: env.EMAIL_FROM, ...message });
  if (error) throw new Error(`Email delivery failed: ${error.message}`);
  return { delivered: true };
}
