import nodemailer from "nodemailer";
import { env } from "../config/env";

function createTransporter() {
  const password = env.SMTP_PASS || env.SMTP_PASSWORD;
  if (!env.SMTP_HOST || !env.SMTP_USER || !password || !env.SMTP_FROM) {
    throw new Error("SMTP email settings are incomplete");
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: password }
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await createTransporter().sendMail({
    from: `CampusHub <${env.SMTP_FROM}>`,
    to: email,
    subject: "Reset your CampusHub password",
    text: `CampusHub received a request to reset your password. Use this link to set a new password. It expires in 15 minutes.\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>CampusHub received a request to reset your password. Use the link below to set a new password. It expires in 15 minutes.</p><p><a href="${resetUrl}">Reset your CampusHub password</a></p><p>If you did not request this, you can ignore this email.</p>`
  });
}

export async function sendSchoolVerificationCode(email: string, code: string) {
  await createTransporter().sendMail({
    from: `CampusHub <${env.SMTP_FROM}>`,
    to: email,
    subject: "Your CampusHub verification code",
    text: `Your CampusHub school email verification code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    html: `<p>Your CampusHub school email verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p><p>It expires in 10 minutes. If you did not request this, you can ignore this email.</p>`
  });
}