import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: {
    DASHBOARD_ORIGIN: "http://localhost:5173",
    APP_BASE_URL: "https://backend.example.test",
    CORS_ORIGIN: "*,https://dashboard.example.test",
    DASHBOARD_COOKIE_NAME: "campushub_dashboard",
    JWT_SECRET: "test-only-secret"
  }
}));
vi.mock("../models/User", () => ({ User: { findById: vi.fn() } }));
vi.mock("jsonwebtoken", () => ({
  default: { verify: vi.fn(() => ({ sub: "student-id", role: "user", tokenVersion: 0 })) }
}));

import { User } from "../models/User";
import { authenticate, requireDashboardOrigin } from "./auth";

function run(handler: (req: Request, res: Response, next: NextFunction) => void, headers: Request["headers"]) {
  const req = { headers } as Request;
  return new Promise<{ error?: { statusCode: number }; req: Request }>((resolve) => {
    handler(req, {} as Response, (error) => resolve({ error, req }));
  });
}

describe("dashboard session origins", () => {
  beforeEach(() => {
    vi.mocked(User.findById).mockReturnValue({
      select: async () => ({
        _id: { toString: () => "student-id" }, role: "user", emailVerified: true,
        tokenVersion: 0, status: "active"
      })
    } as unknown as ReturnType<typeof User.findById>);
  });

  it.each(["http://localhost:5173", "https://dashboard.example.test", "https://backend.example.test"])(
    "accepts dashboard sessions from %s", async (origin) => {
      const { error, req } = await run(authenticate, { origin, cookie: "campushub_dashboard=valid-token" });
      expect(error).toBeUndefined();
      expect(req.user?.role).toBe("user");
    }
  );

  it("rejects cookies sent from an untrusted origin even with wildcard CORS", async () => {
    const { error } = await run(authenticate, { origin: "https://untrusted.example.test", cookie: "campushub_dashboard=valid-token" });
    expect(error?.statusCode).toBe(403);
  });

  it("rejects cross-site requests with an omitted origin", async () => {
    const { error } = await run(requireDashboardOrigin, { "sec-fetch-site": "cross-site" });
    expect(error?.statusCode).toBe(403);
  });

  it("rejects login attempts from an untrusted origin", async () => {
    const { error } = await run(requireDashboardOrigin, { origin: "https://untrusted.example.test" });
    expect(error?.statusCode).toBe(403);
  });

  it("preserves bearer authentication for mobile clients", async () => {
    const { error, req } = await run(authenticate, { origin: "https://mobile.example.test", authorization: "Bearer valid-token" });
    expect(error).toBeUndefined();
    expect(req.user?.role).toBe("user");
  });
});
