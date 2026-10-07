import { Router } from "express";
import rateLimit from "express-rate-limit";
import { confirmSchoolEmailCode, forgotPassword, login, logout, me, register, requestEmailVerification, requestSchoolEmailCode, resetPassword } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, verifySchoolEmailCodeSchema, verifySchoolEmailRequestSchema } from "../validators/authValidators";

export const authRouter = Router();
const passwordResetLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
const limitHandler = (_req: unknown, res: import("express").Response) => res.status(429).json({ success: false, message: "Too many requests. Please try again later." });
const forgotPasswordIpLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 3, standardHeaders: true, legacyHeaders: false, handler: limitHandler });
const forgotPasswordEmailLimit = rateLimit({
	windowMs: 60 * 60 * 1000,
	limit: 3,
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) => typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "invalid-email",
	handler: limitHandler
});
const schoolCodeIpLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 3, standardHeaders: true, legacyHeaders: false, handler: limitHandler });
const schoolCodeEmailLimit = rateLimit({
	windowMs: 60 * 60 * 1000,
	limit: 3,
	standardHeaders: true,
	legacyHeaders: false,
	keyGenerator: (req) => typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "invalid-email",
	handler: limitHandler
});
const schoolCodeConfirmLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, handler: limitHandler });

authRouter.post("/register", validate({ body: registerSchema }), register);
authRouter.post("/login", validate({ body: loginSchema }), login);
authRouter.get("/me", authenticate, me);
authRouter.post("/logout", authenticate, logout);
authRouter.post("/request-email-verification", authenticate, requestEmailVerification);
authRouter.post("/forgot-password", forgotPasswordIpLimit, validate({ body: forgotPasswordSchema }), forgotPasswordEmailLimit, forgotPassword);
authRouter.post("/reset-password", passwordResetLimit, validate({ body: resetPasswordSchema }), resetPassword);
authRouter.post("/verify/request", authenticate, schoolCodeIpLimit, validate({ body: verifySchoolEmailRequestSchema }), schoolCodeEmailLimit, requestSchoolEmailCode);
authRouter.post("/verify/confirm", authenticate, schoolCodeConfirmLimit, validate({ body: verifySchoolEmailCodeSchema }), confirmSchoolEmailCode);
