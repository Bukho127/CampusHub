import { Router } from "express";
import { deleteMe, getPublicUser, requestVendorVerification, updateMe, updateMyAvatar } from "../controllers/userController";
import { authenticate } from "../middleware/auth";
import { uploadProfileAvatar } from "../middleware/upload";
import { validate } from "../middleware/validate";
import { mongoIdParamSchema } from "../validators/commonValidators";
import { updateMeSchema } from "../validators/userValidators";

export const userRouter = Router();

userRouter.get("/:id/public", validate({ params: mongoIdParamSchema }), getPublicUser);
userRouter.patch("/me", authenticate, validate({ body: updateMeSchema }), updateMe);
userRouter.patch("/me/avatar", authenticate, uploadProfileAvatar, updateMyAvatar);
userRouter.patch("/me/vendor-request", authenticate, requestVendorVerification);
userRouter.delete("/me", authenticate, deleteMe);
