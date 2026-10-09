import { Schema, model, type InferSchemaType } from "mongoose";

export type IdentityType = "student" | "faculty" | "resident" | "vendor";
export type Role = "user" | "vendor" | "admin";
export type VerificationState = "unverified" | "pending" | "verified";

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    emailVerified: { type: Boolean, default: false, required: true },
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution" },
    studentNumber: { type: String, trim: true, select: false },
    verifyCodeHash: { type: String, select: false },
    verifyCodeExpires: { type: Date, select: false },
    verifyAttempts: { type: Number, default: 0, min: 0 },
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
    tokenVersion: { type: Number, default: 0, min: 0 },
    status: { type: String,enum: ["active", "banned", "deleted"], default: "active", required: true},
banReason: { type: String, trim: true, maxlength: 1000 },
bannedUntil: { type: Date },
deletedAt: { type: Date },
    identityType: {
      type: String,
      enum: ["student", "faculty", "resident", "vendor"],
      required: true
    },
    role: {
      type: String,
      enum: ["user", "vendor", "admin"],
      default: "user",
      required: true
    },
    emailVerificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified"],
      default: "unverified",
      required: true
    },
    vendorVerificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified"],
      default: "unverified",
      required: true
    },
    rating: { type: Number, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    campusEmail: { type: String, lowercase: true, trim: true, select: false },
    campusEmailVerificationStatus: { type: String, enum: ["unverified", "pending", "verified"], default: "unverified" },
    campusEmailVerifiedAt: { type: Date },
    campusEmailVerificationTokenHash: { type: String, select: false },
    campusEmailVerificationExpiresAt: { type: Date, select: false },
    location: { type: String, trim: true },
    avatar: { type: String, trim: true }
  },
  { timestamps: true }
);

userSchema.index({ displayName: "text", location: "text" });
userSchema.index({ campusEmail: 1 }, { unique: true, sparse: true });

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: unknown };
export const User = model("User", userSchema);
