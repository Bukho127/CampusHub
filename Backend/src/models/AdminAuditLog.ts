import { Schema, model } from "mongoose";

const adminAuditLogSchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  action: { type: String, required: true, trim: true, maxlength: 120 },
  targetType: { type: String, required: true, trim: true, maxlength: 80 },
  targetId: { type: String, required: true, trim: true, maxlength: 100 },
  metadata: { type: Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, trim: true },
  userAgent: { type: String, trim: true, maxlength: 500 }
}, { timestamps: true });

adminAuditLogSchema.index({ createdAt: -1 });
adminAuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

export const AdminAuditLog = model("AdminAuditLog", adminAuditLogSchema);
