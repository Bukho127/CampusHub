import { Router } from "express";
import rateLimit from "express-rate-limit";
import { reportListing, reportSeller } from "../controllers/reportController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { mongoIdParamSchema } from "../validators/commonValidators";
import { createReportSchema, createSellerReportSchema } from "../validators/reportValidators";

export const reportRouter = Router();
const sellerReportLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 3, standardHeaders: true, legacyHeaders: false });

reportRouter.post("/listing/:id", authenticate, validate({ params: mongoIdParamSchema, body: createReportSchema }), reportListing);
reportRouter.post("/seller/:id", authenticate, sellerReportLimit, validate({ params: mongoIdParamSchema, body: createSellerReportSchema }), reportSeller);
