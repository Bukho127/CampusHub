import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createSellerReview, getSellerReviews } from "../controllers/reviewController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { mongoIdParamSchema } from "../validators/commonValidators";
import { createReviewSchema } from "../validators/reviewValidators";

export const reviewRouter = Router();
const createReviewLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });

reviewRouter.get("/seller/:id", validate({ params: mongoIdParamSchema }), getSellerReviews);
reviewRouter.post("/seller/:id", authenticate, createReviewLimit, validate({ params: mongoIdParamSchema, body: createReviewSchema }), createSellerReview);