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

export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    throw new AppError("Authentication required", 401);
  }

  const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  const user = await User.findById(payload.sub).select("_id role emailVerified tokenVersion");

  if (!user || (payload.tokenVersion ?? 0) !== user.tokenVersion) {
    throw new AppError("User no longer exists", 401);
  }

  req.user = {
    id: user._id.toString(),
    role: user.role as Role,
    emailVerified: Boolean(user.emailVerified),
    tokenVersion: user.tokenVersion
  };

  next();
});

export const optionalAuthenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    next();
    return;
  }

  const payload = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  const user = await User.findById(payload.sub).select("_id role emailVerified tokenVersion");

  if (user && (payload.tokenVersion ?? 0) === user.tokenVersion) {
    req.user = {
      id: user._id.toString(),
      role: user.role as Role,
      emailVerified: Boolean(user.emailVerified),
      tokenVersion: user.tokenVersion
    };
  }

  next();
});

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
