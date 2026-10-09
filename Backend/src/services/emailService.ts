import nodemailer from "nodemailer";
import { env } from "../config/env";

type OrderEmailItem = {
  title: string;
  quantity: number;
  lineTotalCents: number;
};

type ServiceRequestEmail = {
  listingTitle: string;
  requesterEmail: string;
  requesterName: string;
  sellerName: string;
  note: string;
  preferredTime: string;
};

type OrderReceiptEmail = {
  buyerName: string;
  items: OrderEmailItem[];
  paymentMethod: string;
  totalCents: number;
};

type SellerOrderEmail = {
  buyerEmail: string;
  buyerName: string;
  items: OrderEmailItem[];
  sellerName: string;
};

type ServiceCompletedEmail = {
  listingTitle: string;
  sellerName: string;
  completedAt: string;
  customerEmail?: string;
  customerName?: string;
};

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

function money(cents: number) {
  return new Intl.NumberFormat("en-ZA", { currency: "ZAR", style: "currency" }).format(cents / 100);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function orderLines(items: OrderEmailItem[]) {
  return items.map((item) => `${item.quantity} x ${item.title} - ${money(item.lineTotalCents)}`).join("\n");
}

function orderHtml(items: OrderEmailItem[]) {
  return `<ul>${items.map((item) => `<li>${item.quantity} x ${escapeHtml(item.title)} - ${money(item.lineTotalCents)}</li>`).join("")}</ul>`;
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

export async function sendServiceRequestEmail(email: string, details: ServiceRequestEmail) {
  await createTransporter().sendMail({
    from: `CampusHub <${env.SMTP_FROM}>`,
    to: email,
    subject: `New service request: ${details.listingTitle}`,
    text: `Hi ${details.sellerName},\n\n${details.requesterName} requested your service "${details.listingTitle}".\n\nPreferred time: ${details.preferredTime}\nRequester email: ${details.requesterEmail}\n\nRequest details:\n${details.note}\n\nPlease reply to the requester to continue the booking.`,
    html: `<p>Hi ${escapeHtml(details.sellerName)},</p><p><strong>${escapeHtml(details.requesterName)}</strong> requested your service <strong>${escapeHtml(details.listingTitle)}</strong>.</p><p><strong>Preferred time:</strong> ${escapeHtml(details.preferredTime)}<br/><strong>Requester email:</strong> ${escapeHtml(details.requesterEmail)}</p><p><strong>Request details</strong></p><p>${escapeHtml(details.note).replace(/\n/g, "<br/>")}</p><p>Please reply to the requester to continue the booking.</p>`
  });
}

export async function sendServiceRequestConfirmationEmail(email: string, details: ServiceRequestEmail) {
  await createTransporter().sendMail({
    from: `CampusHub <${env.SMTP_FROM}>`,
    to: email,
    subject: `Service request sent: ${details.listingTitle}`,
    text: `Hi ${details.requesterName},\n\nYour request for "${details.listingTitle}" was sent to ${details.sellerName}.\n\nPreferred time: ${details.preferredTime}\n\nRequest details:\n${details.note}`,
    html: `<p>Hi ${escapeHtml(details.requesterName)},</p><p>Your request for <strong>${escapeHtml(details.listingTitle)}</strong> was sent to ${escapeHtml(details.sellerName)}.</p><p><strong>Preferred time:</strong> ${escapeHtml(details.preferredTime)}</p><p><strong>Request details</strong></p><p>${escapeHtml(details.note).replace(/\n/g, "<br/>")}</p>`
  });
}

export async function sendOrderReceiptEmail(email: string, details: OrderReceiptEmail) {
  await createTransporter().sendMail({
    from: `CampusHub <${env.SMTP_FROM}>`,
    to: email,
    subject: "Your CampusHub order confirmation",
    text: `Hi ${details.buyerName},\n\nYour ${details.paymentMethod} order is confirmed.\n\n${orderLines(details.items)}\n\nTotal: ${money(details.totalCents)}\n\nThe seller has been notified by email.`,
    html: `<p>Hi ${escapeHtml(details.buyerName)},</p><p>Your ${escapeHtml(details.paymentMethod)} order is confirmed.</p>${orderHtml(details.items)}<p><strong>Total:</strong> ${money(details.totalCents)}</p><p>The seller has been notified by email.</p>`
  });
}

export async function sendSellerOrderEmail(email: string, details: SellerOrderEmail) {
  await createTransporter().sendMail({
    from: `CampusHub <${env.SMTP_FROM}>`,
    to: email,
    subject: "You made a CampusHub sale",
    text: `Hi ${details.sellerName},\n\n${details.buyerName} bought:\n\n${orderLines(details.items)}\n\nBuyer email: ${details.buyerEmail}\n\nPlease contact the buyer to arrange collection or delivery.`,
    html: `<p>Hi ${escapeHtml(details.sellerName)},</p><p>${escapeHtml(details.buyerName)} bought:</p>${orderHtml(details.items)}<p><strong>Buyer email:</strong> ${escapeHtml(details.buyerEmail)}</p><p>Please contact the buyer to arrange collection or delivery.</p>`
  });
}

export async function sendServiceCompletedEmail(email: string, details: ServiceCompletedEmail) {
  const customerLine = details.customerEmail
    ? `\nCustomer: ${details.customerName ?? "CampusHub customer"} (${details.customerEmail})`
    : "";
  const customerHtml = details.customerEmail
    ? `<p><strong>Customer:</strong> ${escapeHtml(details.customerName ?? "CampusHub customer")} (${escapeHtml(details.customerEmail)})</p>`
    : "";

  await createTransporter().sendMail({
    from: `CampusHub <${env.SMTP_FROM}>`,
    to: email,
    subject: `Service completed: ${details.listingTitle}`,
    text: `Hi ${details.sellerName},\n\nYour service "${details.listingTitle}" was marked complete on ${details.completedAt}.${customerLine}\n\nThanks for serving the CampusHub community.`,
    html: `<p>Hi ${escapeHtml(details.sellerName)},</p><p>Your service <strong>${escapeHtml(details.listingTitle)}</strong> was marked complete on ${escapeHtml(details.completedAt)}.</p>${customerHtml}<p>Thanks for serving the CampusHub community.</p>`
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
