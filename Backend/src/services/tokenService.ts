import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import type { Role } from "../models/User";

export function signAccessToken(userId: string, role: Role, tokenVersion = 0) {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  };

  return jwt.sign({ role, tokenVersion }, env.JWT_SECRET, {
    subject: userId,
    ...options
  });
}
