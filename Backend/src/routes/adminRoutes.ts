import { Router } from "express";
import { updateUserVerification } from "../controllers/adminController";
import { authenticate, requireRoles } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { verificationUpdateSchema } from "../validators/adminValidators";
import { mongoIdParamSchema } from "../validators/commonValidators";

export const adminRouter = Router();

adminRouter.use(authenticate, requireRoles("admin"));
adminRouter.patch("/users/:id/verification", validate({ params: mongoIdParamSchema, body: verificationUpdateSchema }), updateUserVerification);
