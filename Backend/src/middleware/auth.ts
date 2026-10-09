import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User, type Role } from "../models/User";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

type TokenPayload = {
  sub: string;
  role: Role;
  tokenVersion?: number;
};

const dashboardOrigins = new Set([
  new URL(env.DASHBOARD_ORIGIN).origin,
  ...(env.APP_BASE_URL ? [new URL(env.APP_BASE_URL).origin] : []),
  ...env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter((origin) => origin && origin !== "*")
]);

function assertDashboardOrigin(req: Request) {
  const origin = req.headers.origin;
  if ((origin && !dashboardOrigins.has(origin)) || (!origin && req.headers["sec-fetch-site"] === "cross-site")) {
    throw new AppError("Dashboard origin is not allowed", 403);
  }
}

export function requireDashboardOrigin(req: Request, _res: Response, next: NextFunction) {
  try {
    assertDashboardOrigin(req);
    next();
  } catch (error) {
    next(error);
  }
}

function getDashboardCookie(req: Request): string | null {
  const prefix = `${env.DASHBOARD_COOKIE_NAME}=`;
  const value = req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);

  if (!value) return null;

  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

function setRequestUser(
  req: Request,
  user: {
    _id: { toString(): string };
    role: Role;
    emailVerified: boolean;
    tokenVersion: number;
  }
) {
  req.user = {
    id: user._id.toString(),
    role: user.role,
    emailVerified: Boolean(user.emailVerified),
    tokenVersion: user.tokenVersion
  };
}

export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const bearerToken = getBearerToken(req);
    const token = bearerToken ?? getDashboardCookie(req);

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    if (!bearerToken) assertDashboardOrigin(req);

    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    const user = await User.findById(payload.sub).select(
      "_id role emailVerified tokenVersion status"
    );

    if (
      !user ||
      user.status === "banned" ||
      user.status === "deleted" ||
      (payload.tokenVersion ?? 0) !== user.tokenVersion
    ) {
      throw new AppError("User no longer exists or is inactive", 401);
    }

    setRequestUser(req, user);
    next();
  }
);

export const optionalAuthenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = getBearerToken(req);

    if (!token) {
      next();
      return;
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    const user = await User.findById(payload.sub).select(
      "_id role emailVerified tokenVersion status"
    );

    if (
      user &&
      user.status !== "banned" &&
      user.status !== "deleted" &&
      (payload.tokenVersion ?? 0) === user.tokenVersion
    ) {
      setRequestUser(req, user);
    }

    next();
  }
);

type StepUpPayload = {
  sub: string;
  tokenVersion: number;
  purpose: "dashboard-step-up";
};

export const requireStepUp = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const prefix = `${env.DASHBOARD_STEPUP_COOKIE_NAME}=`;
    const raw = req.headers.cookie
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix))
      ?.slice(prefix.length);

    if (!raw || !req.user) {
      throw new AppError("Recent password verification is required", 403);
    }

    let payload: StepUpPayload;
    try {
      payload = jwt.verify(decodeURIComponent(raw), env.JWT_SECRET) as StepUpPayload;
    } catch {
      throw new AppError("Recent password verification is required", 403);
    }

    if (
      payload.purpose !== "dashboard-step-up" ||
      payload.sub !== req.user.id ||
      payload.tokenVersion !== req.user.tokenVersion
    ) {
      throw new AppError("Recent password verification is required", 403);
    }

    next();
  }
);

export function requireRoles(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError("Authentication required", 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError("You do not have permission to perform this action", 403));
      return;
    }

    next();
  };
}

export function requireEmailVerified(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    next(new AppError("Authentication required", 401));
    return;
  }

  if (!req.user.emailVerified) {
    next(new AppError("Verify your school email before creating listings", 403));
    return;
  }

  next();
}
