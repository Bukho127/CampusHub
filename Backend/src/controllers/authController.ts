import bcrypt from "bcrypt";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";
import type { Request, Response } from "express";
import { env } from "../config/env";
import { Institution } from "../models/Institution";
import { User } from "../models/User";
import { sendPasswordResetEmail, sendSchoolVerificationCode } from "../services/emailService";
import { signAccessToken } from "../services/tokenService";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { resetPasswordSchema } from "../validators/authValidators";
import jwt from "jsonwebtoken";

const schoolCodeSentMessage = "If that email belongs to an active institution, a verification code has been sent.";
const passwordResetSentMessage = "If an account exists for that email, reset instructions have been sent.";

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function clearSchoolVerificationCode(user: InstanceType<typeof User>, resetAttempts = false) {
  user.verifyCodeHash = undefined;
  user.verifyCodeExpires = undefined;
  if (resetAttempts) user.verifyAttempts = 0;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character] ?? character);
}

function setResetPageHeaders(res: Response) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
}

function resetPage(title: string, message: string, token?: string) {
  const form = token
    ? `<form method="post" action="/auth/reset-password"><input type="hidden" name="token" value="${escapeHtml(token)}"><label>New password<input type="password" name="password" minlength="8" maxlength="128" autocomplete="new-password" required></label><label>Confirm new password<input type="password" name="confirmPassword" minlength="8" maxlength="128" autocomplete="new-password" required></label><button type="submit">Update password</button></form>`
    : "";

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} | CampusHub</title><style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#f7f7f7;color:#171717;margin:0;padding:24px}.panel{max-width:420px;margin:10vh auto;background:#fff;border:1px solid #dedede;border-radius:12px;padding:24px}h1{font-size:24px;margin:0 0 12px}p{color:#656565;line-height:1.5}label{display:block;font-size:14px;font-weight:600;margin:18px 0}input{box-sizing:border-box;display:block;width:100%;min-height:48px;margin-top:8px;padding:10px 12px;border:1px solid #dedede;border-radius:8px;font:inherit}button{width:100%;min-height:48px;border:0;border-radius:999px;background:#222;color:#fff;font:inherit;font-weight:700;margin-top:8px}</style></head><body><main class="panel"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p>${form}</main></body></html>`;
}

async function applyPasswordReset(token: string, password: string) {
  const tokenHash = hashValue(token);
  const user = await User.findOne({ resetTokenHash: tokenHash, resetTokenExpires: { $gt: new Date() } })
    .select("+resetTokenHash +resetTokenExpires +passwordHash +passwordResetTokenHash +passwordResetExpiresAt");

  if (!user) throw new AppError("This password reset link is invalid or has expired", 400);

  user.passwordHash = await bcrypt.hash(password, 12);
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  user.tokenVersion += 1;
  await user.save();
}

function publicUser(user: {
  _id: unknown;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  identityType: string;
  role: string;
  emailVerificationStatus: string;
  emailVerified?: boolean;
  vendorVerificationStatus: string;
  campusEmailVerificationStatus?: string;
  campusEmailVerifiedAt?: Date | null;
  rating?: number | null;
  reviewCount: number;
  location?: string | null;
  avatar?: string | null;
}) {
  return {
    id: String(user._id),
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    email: user.email,
    identityType: user.identityType,
    role: user.role,
    emailVerificationStatus: user.emailVerificationStatus,
    emailVerified: Boolean(user.emailVerified),
    vendorVerificationStatus: user.vendorVerificationStatus,
    campusEmailVerificationStatus: user.campusEmailVerificationStatus ?? "unverified",
    campusEmailVerified: Boolean(user.campusEmailVerifiedAt),
    rating: user.rating,
    reviewCount: user.reviewCount,
    location: user.location,
    avatar: user.avatar
  };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, identityType } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    firstName,
    lastName,
    displayName: `${firstName} ${lastName}`,
    email,
    passwordHash,
    identityType,
    role: identityType === "vendor" ? "vendor" : "user",
    emailVerificationStatus: "pending",
    vendorVerificationStatus: identityType === "vendor" ? "pending" : "unverified"
  });

  const token = signAccessToken(user._id.toString(), user.role, user.tokenVersion);
  sendSuccess(res, { user: publicUser(user), token }, "Registered", 201);
});
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = signAccessToken(user._id.toString(), user.role, user.tokenVersion);
  sendSuccess(res, { user: publicUser(user), token }, "Logged in");
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  sendSuccess(res, { user: publicUser(user) });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, null, "Logged out. Discard the access token on the client.");
});

export const requestEmailVerification = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.emailVerificationStatus === "unverified") {
    user.emailVerificationStatus = "pending";
    await user.save();
  }

  sendSuccess(res, { emailVerificationStatus: user.emailVerificationStatus }, "Verification request recorded. Email delivery is a future integration.");
});

export const requestSchoolEmailCode = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id).select("+campusEmail +studentNumber");
  if (!user) throw new AppError("User not found", 404);
  if (user.emailVerified) {
    sendSuccess(res, null, schoolCodeSentMessage);
    return;
  }

  const email = String(req.body.email).trim().toLowerCase();
  const domain = email.slice(email.lastIndexOf("@") + 1);
  const institutions = await Institution.find({ active: true }).select("_id name domains");
  const institution = institutions.find((item) => item.domains.some((allowedDomain) => allowedDomain.trim().toLowerCase() === domain));
  if (!institution) {
    sendSuccess(res, null, schoolCodeSentMessage);
    return;
  }

  const alreadyLinked = await User.exists({ campusEmail: email, _id: { $ne: user._id } });
  if (alreadyLinked) {
    sendSuccess(res, null, schoolCodeSentMessage);
    return;
  }

  const code = String(randomInt(100000, 1000000));
  user.campusEmail = email;
  if (req.body.studentNumber !== undefined) user.studentNumber = req.body.studentNumber.trim() || undefined;
  user.verifyCodeHash = hashValue(code);
  user.verifyCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
  user.verifyAttempts = 0;
  user.campusEmailVerificationStatus = "pending";
  await user.save();

  try {
    await sendSchoolVerificationCode(email, code);
  } catch {
    clearSchoolVerificationCode(user, true);
    user.campusEmailVerificationStatus = "unverified";
    await user.save();
    throw new AppError("Unable to send verification email right now. Please try again later.", 503);
  }

  sendSuccess(res, null, schoolCodeSentMessage);
});

export const confirmSchoolEmailCode = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id)
    .select("+campusEmail +verifyCodeHash +verifyCodeExpires +studentNumber");
  if (!user) throw new AppError("User not found", 404);
  if (!user.verifyCodeHash || !user.verifyCodeExpires || user.verifyCodeExpires.getTime() <= Date.now()) {
    clearSchoolVerificationCode(user);
    user.campusEmailVerificationStatus = "unverified";
    await user.save();
    throw new AppError("Verification code expired. Request a new code.", 400);
  }

  const submittedHash = Buffer.from(hashValue(String(req.body.code)), "hex");
  const storedHash = Buffer.from(user.verifyCodeHash, "hex");
  const matches = storedHash.length === submittedHash.length && timingSafeEqual(storedHash, submittedHash);

  if (!matches) {
    user.verifyAttempts += 1;
    if (user.verifyAttempts >= 5) {
      clearSchoolVerificationCode(user);
      user.campusEmailVerificationStatus = "unverified";
      await user.save();
      throw new AppError("Too many incorrect attempts. Request a new code.", 429);
    }
    await user.save();
    throw new AppError(`Incorrect code. ${5 - user.verifyAttempts} attempts remaining.`, 400);
  }

  const domain = user.campusEmail?.slice(user.campusEmail.lastIndexOf("@") + 1).trim().toLowerCase();
  const institutions = await Institution.find({ active: true }).select("_id domains");
  const institution = institutions.find((item) => item.domains.some((allowedDomain) => allowedDomain.trim().toLowerCase() === domain));
  if (!institution) {
    clearSchoolVerificationCode(user);
    user.campusEmailVerificationStatus = "unverified";
    await user.save();
    throw new AppError("This institution is no longer active. Request a new code with an active school email.", 400);
  }

  user.emailVerified = true;
  user.institutionId = institution._id;
  user.campusEmailVerificationStatus = "verified";
  user.campusEmailVerifiedAt = new Date();
  clearSchoolVerificationCode(user, true);
  await user.save();

  sendSuccess(res, { user: publicUser(user) }, "School email verified");
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  if (!env.APP_BASE_URL) {
    throw new AppError("Password reset is not configured. Please try again later.", 503);
  }
  const user = await User.findOne({ email: req.body.email });

  if (user) {
    const resetToken = randomBytes(32).toString("hex");
    user.resetTokenHash = hashValue(resetToken);
    user.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();

    if (!env.APP_BASE_URL) {
      user.resetTokenHash = undefined;
      user.resetTokenExpires = undefined;
      await user.save();
      throw new AppError("Password reset email is not configured. Please contact support.", 503);
    }

    const resetUrl = `${env.APP_BASE_URL.replace(/\/$/, "")}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;
    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch {
      user.resetTokenHash = undefined;
      user.resetTokenExpires = undefined;
      await user.save();
      throw new AppError("Unable to send a password reset email right now. Please try again later.", 503);
    }
  }

  sendSuccess(res, null, passwordResetSentMessage);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await applyPasswordReset(req.body.token, req.body.password);
  sendSuccess(res, null, "Password updated. You can now log in.");
});

export const renderPasswordResetPage = (req: Request, res: Response) => {
  setResetPageHeaders(res);
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token || token.length > 256) {
    res.status(400).type("html").send(resetPage("Reset link unavailable", "This password reset link is invalid. Request a new one."));
    return;
  }
  res.type("html").send(resetPage("Reset your password", "Choose a new password. This link expires in 15 minutes.", token));
};

export const submitPasswordResetPage = asyncHandler(async (req: Request, res: Response) => {
  setResetPageHeaders(res);
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    const passwordMismatch = parsed.error.issues.some((issue) => issue.path.includes("confirmPassword"));
    const message = passwordMismatch
      ? "The new password and confirmation do not match. Please try again."
      : "Your new password must be between 8 and 128 characters.";
    res.status(400).type("html").send(resetPage("Password not updated", message));
    return;
  }

  try {
    await applyPasswordReset(parsed.data.token, parsed.data.password);
    res.type("html").send(resetPage("Password updated", "Your password has been changed. You can now return to CampusHub and log in."));
  } catch (error) {
    const status = error instanceof AppError ? error.statusCode : 500;
    const message = status === 400 ? "This reset link is invalid or has expired. Request a new one." : "We could not reset your password right now. Please try again later.";
    res.status(status).type("html").send(resetPage("Password not updated", message));
  }
});

const dashboardLoginFailures = new Map<
  string,
  { count: number; lockedUntil: number }
>();

export const dashboardLogin = asyncHandler(async (req: Request, res: Response) => {
  const email = String(req.body.email).trim().toLowerCase();
  const password = String(req.body.password);
  const priorFailures = dashboardLoginFailures.get(email);

  if (priorFailures && priorFailures.lockedUntil > Date.now()) {
    throw new AppError("Invalid email or password", 401);
  }

  const user = await User.findOne({ email }).select("+passwordHash");
  const passwordMatches =
    user !== null && (await bcrypt.compare(password, user.passwordHash));

  if (!user || !passwordMatches) {
    const failures = (priorFailures?.count ?? 0) + 1;
    dashboardLoginFailures.set(email, {
      count: failures >= 5 ? 0 : failures,
      lockedUntil: failures >= 5 ? Date.now() + 15 * 60 * 1000 : 0
    });
    throw new AppError("Invalid email or password", 401);
  }

  dashboardLoginFailures.delete(email);

  if (user.status === "banned" || user.status === "deleted") {
    throw new AppError("This account cannot access the dashboard", 403);
  }

  const isStudent = user.role === "user" && user.identityType === "student";
  if (user.role !== "admin" && user.role !== "vendor" && !isStudent) {
    throw new AppError(
      "The dashboard is available to students, admins and vendors.",
      403
    );
  }

  const token = jwt.sign(
    { role: user.role, tokenVersion: user.tokenVersion },
    env.JWT_SECRET,
    { subject: user._id.toString(), expiresIn: "1h" }
  );

  res.cookie(env.DASHBOARD_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "strict",
    path: "/api",
    maxAge: 60 * 60 * 1000
  });

  sendSuccess(res, { user: publicUser(user) }, "Logged in");
});

export const dashboardLogout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(env.DASHBOARD_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "strict",
    path: "/api"
  });
  res.clearCookie(env.DASHBOARD_STEPUP_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "strict",
    path: "/api"
  });

  sendSuccess(res, null, "Logged out");
});

export const stepUp = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id).select("+passwordHash tokenVersion");
  if (!user || !(await bcrypt.compare(String(req.body.password), user.passwordHash))) {
    throw new AppError("Password verification failed", 401);
  }

  const token = jwt.sign(
    { tokenVersion: user.tokenVersion, purpose: "dashboard-step-up" },
    env.JWT_SECRET,
    { subject: user._id.toString(), expiresIn: "5m" }
  );

  res.cookie(env.DASHBOARD_STEPUP_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "strict",
    path: "/api",
    maxAge: 5 * 60 * 1000
  });

  sendSuccess(res, { expiresInSeconds: 300 }, "Step-up verification accepted");
});
