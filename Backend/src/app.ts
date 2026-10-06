import path from "path";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { apiRouter } from "./routes";
import { sendSuccess } from "./utils/apiResponse";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 250,
    standardHeaders: true,
    legacyHeaders: false
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/uploads", express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

app.get("/", (_req, res) => {
  sendSuccess(res, {
    name: "Community Store API",
    health: "/health",
    apiBase: "/api",
    routes: {
      categories: "/api/categories",
      listings: "/api/listings",
      auth: "/api/auth",
      communityPosts: "/api/community-posts"
    }
  });
});

app.get("/health", (_req, res) => {
  sendSuccess(res, { status: "ok" }, "Community Store API is healthy");
});

app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);
