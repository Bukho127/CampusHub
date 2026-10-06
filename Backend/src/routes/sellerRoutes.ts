import { Router } from "express";
import { getSeller, getSellerListings } from "../controllers/userController";
import { validate } from "../middleware/validate";
import { mongoIdParamSchema } from "../validators/commonValidators";

export const sellerRouter = Router();

sellerRouter.get("/:id", validate({ params: mongoIdParamSchema }), getSeller);
sellerRouter.get("/:id/listings", validate({ params: mongoIdParamSchema }), getSellerListings);
