import { Router } from "express";
import { getPublicUser, requestVendorVerification, updateMe } from "../controllers/userController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { mongoIdParamSchema } from "../validators/commonValidators";
import { updateMeSchema } from "../validators/userValidators";

export const userRouter = Router();

userRouter.get("/:id/public", validate({ params: mongoIdParamSchema }), getPublicUser);
userRouter.patch("/me", authenticate, validate({ body: updateMeSchema }), updateMe);
userRouter.patch("/me/vendor-request", authenticate, requestVendorVerification);
