import fs from "fs";
import path from "path";
import multer from "multer";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);

fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadRoot);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    callback(null, `${Date.now()}-${safeBase || "upload"}${extension}`);
  }
});

export const uploadListingImages = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 8
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new AppError("Only JPEG, PNG, and WebP images are allowed", 400));
      return;
    }
    callback(null, true);
  }
}).array("images", 8);

export const uploadProfileAvatar = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new AppError("Only JPEG, PNG, and WebP images are allowed", 400));
      return;
    }
    callback(null, true);
  }
}).single("avatar");

export const uploadCommunityImage = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new AppError("Only JPEG, PNG, and WebP images are allowed", 400));
      return;
    }
    callback(null, true);
  }
}).single("image");
