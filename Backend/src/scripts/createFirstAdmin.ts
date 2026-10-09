import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { connectDatabase } from "../config/db";
import { User } from "../models/User";

async function createFirstAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in Backend/.env first.");
  }

  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters long.");
  }

  await connectDatabase();

  const existingAdmin = await User.exists({ role: "admin" });

  if (existingAdmin) {
    throw new Error(
      "An admin already exists. This bootstrap script only runs before the first admin is created."
    );
  }

  const existingUser = await User.exists({ email });

  if (existingUser) {
    throw new Error(
      "That email already belongs to an account. Choose an unused ADMIN_EMAIL."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({
    firstName: "CampusHub",
    lastName: "Administrator",
    displayName: "CampusHub Administrator",
    email,
    passwordHash,
    identityType: "faculty",
    role: "admin",
    status: "active",
    emailVerified: true,
    emailVerificationStatus: "verified",
    vendorVerificationStatus: "unverified",
    tokenVersion: 0
  });

  console.log(`Created the first admin account for ${email}.`);
}

createFirstAdmin()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Admin bootstrap failed.";
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });