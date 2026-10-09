import type { Request } from "express";
import { AdminAuditLog } from "../models/AdminAuditLog";

export async function recordAdminAudit(req: Request, action: string, targetType: string, targetId: string, metadata: Record<string, unknown> = {}) {
  if (!req.user?.id) return;
  await AdminAuditLog.create({
    actor: req.user.id,
    action,
    targetType,
    targetId,
    metadata,
    ipAddress: req.ip,
    userAgent: req.get("user-agent")?.slice(0, 500)
  });
}
