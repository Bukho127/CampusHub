import path from "path";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { apiRouter } from "./routes";
import { renderPasswordResetPage, submitPasswordResetPage } from "./controllers/authController";
import { sendSuccess } from "./utils/apiResponse";

const allowedOrigins = new Set([
  ...env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter((origin) => origin && origin !== "*"),
  env.DASHBOARD_ORIGIN
]);

const resetPageLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
morgan.token("safe-url", (req) => (req.url ?? "").replace(/([?&]token=)[^&]*/gi, "$1[redacted]"));

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
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
app.use(morgan(env.NODE_ENV === "production"
  ? ":remote-addr :method :safe-url :status :res[content-length] - :response-time ms"
  : ":method :safe-url :status :response-time ms"));

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

app.get("/auth/reset-password", renderPasswordResetPage);
app.post("/auth/reset-password", resetPageLimit, submitPasswordResetPage);

app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);
