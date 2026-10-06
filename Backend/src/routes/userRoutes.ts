import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getPublicUser, requestCampusEmailVerification, requestVendorVerification, updateMe, updateMyAvatar } from "../controllers/userController";
import { authenticate } from "../middleware/auth";
import { uploadProfileAvatar } from "../middleware/upload";
import { validate } from "../middleware/validate";
import { mongoIdParamSchema } from "../validators/commonValidators";
import { campusEmailVerificationSchema, updateMeSchema } from "../validators/userValidators";

export const userRouter = Router();
const campusVerificationRequestLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 3, standardHeaders: true, legacyHeaders: false });

userRouter.get("/:id/public", validate({ params: mongoIdParamSchema }), getPublicUser);
userRouter.patch("/me", authenticate, validate({ body: updateMeSchema }), updateMe);
userRouter.patch("/me/avatar", authenticate, uploadProfileAvatar, updateMyAvatar);
userRouter.patch("/me/vendor-request", authenticate, requestVendorVerification);
userRouter.post("/me/campus-verification", authenticate, campusVerificationRequestLimit, validate({ body: campusEmailVerificationSchema }), requestCampusEmailVerification);
