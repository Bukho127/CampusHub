import { Router } from "express";
import rateLimit from "express-rate-limit";
import { forgotPassword, login, logout, me, register, requestEmailVerification, resetPassword, verifyCampusEmail } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, verifyCampusEmailSchema } from "../validators/authValidators";

export const authRouter = Router();
const passwordResetLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });

authRouter.post("/register", validate({ body: registerSchema }), register);
authRouter.post("/login", validate({ body: loginSchema }), login);
authRouter.get("/me", authenticate, me);
authRouter.post("/logout", authenticate, logout);
authRouter.post("/request-email-verification", authenticate, requestEmailVerification);
authRouter.post("/forgot-password", passwordResetLimit, validate({ body: forgotPasswordSchema }), forgotPassword);
authRouter.post("/reset-password", passwordResetLimit, validate({ body: resetPasswordSchema }), resetPassword);
authRouter.post("/verify-campus-email", passwordResetLimit, validate({ body: verifyCampusEmailSchema }), verifyCampusEmail);
