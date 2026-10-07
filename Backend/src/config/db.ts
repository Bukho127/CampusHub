import mongoose from "mongoose";
import { env } from "./env";
import { Institution } from "../models/Institution";

export async function connectDatabase() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
  });
  await Institution.updateOne(
    { name: "CPUT" },
    { $setOnInsert: { name: "CPUT", domains: ["mycput.ac.za", "cput.ac.za"], active: true } },
    { upsert: true }
  );
  console.log("MongoDB connected");
}
