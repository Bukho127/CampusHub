import { Router } from "express";
import { forgotPassword, login, logout, me, register, requestEmailVerification } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { forgotPasswordSchema, loginSchema, registerSchema } from "../validators/authValidators";

export const authRouter = Router();

authRouter.post("/register", validate({ body: registerSchema }), register);
authRouter.post("/login", validate({ body: loginSchema }), login);
authRouter.get("/me", authenticate, me);
authRouter.post("/logout", authenticate, logout);
authRouter.post("/request-email-verification", authenticate, requestEmailVerification);
authRouter.post("/forgot-password", validate({ body: forgotPasswordSchema }), forgotPassword);
