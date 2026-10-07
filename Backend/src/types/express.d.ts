import type { Role } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        emailVerified: boolean;
        tokenVersion: number;
      };
    }
  }
}
