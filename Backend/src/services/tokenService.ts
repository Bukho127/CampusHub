import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import type { Role } from "../models/User";

export function signAccessToken(userId: string, role: Role) {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  };

  return jwt.sign({ role }, env.JWT_SECRET, {
    subject: userId,
    ...options
  });
}
