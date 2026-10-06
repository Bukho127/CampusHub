import nodemailer from "nodemailer";
import { env } from "../config/env";

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD || !env.SMTP_FROM) {
    throw new Error("SMTP email settings are incomplete");
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
  });

  await transporter.sendMail({
    from: `CampusHub <${env.SMTP_FROM}>`,
    to: email,
    subject: "Reset your CampusHub password",
    text: `CampusHub received a request to reset your password. Use this link to set a new password. It expires in 30 minutes.\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>CampusHub received a request to reset your password. Use the link below to set a new password. It expires in 30 minutes.</p><p><a href="${resetUrl}">Reset your CampusHub password</a></p><p>If you did not request this, you can ignore this email.</p>`
  });
}

export async function sendCampusVerificationEmail(email: string, verificationUrl: string) {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD || !env.SMTP_FROM) {
    throw new Error("SMTP email settings are incomplete");
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
  });

  await transporter.sendMail({
    from: `CampusHub <${env.SMTP_FROM}>`,
    to: email,
    subject: "Verify your CampusHub email",
    text: `Confirm access to your CPUT email address to earn a Campus email verified badge. This link expires in 30 minutes.\n\n${verificationUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>Confirm access to your CPUT email address to earn a Campus email verified badge. This link expires in 30 minutes.</p><p><a href="${verificationUrl}">Verify campus email</a></p><p>If you did not request this, you can ignore this email.</p>`
  });
}