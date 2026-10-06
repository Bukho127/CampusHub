import { Router } from "express";
import { createListing, deleteListing, getListing, getListings, markSold, updateListing } from "../controllers/listingController";
import { authenticate } from "../middleware/auth";
import { uploadListingImages } from "../middleware/upload";
import { validate } from "../middleware/validate";
import { mongoIdParamSchema } from "../validators/commonValidators";
import { createListingSchema, listingQuerySchema, updateListingSchema } from "../validators/listingValidators";

export const listingRouter = Router();

listingRouter.get("/", validate({ query: listingQuerySchema }), getListings);
listingRouter.get("/:id", validate({ params: mongoIdParamSchema }), getListing);
listingRouter.post("/", authenticate, uploadListingImages, validate({ body: createListingSchema }), createListing);
listingRouter.patch("/:id", authenticate, uploadListingImages, validate({ params: mongoIdParamSchema, body: updateListingSchema }), updateListing);
listingRouter.delete("/:id", authenticate, validate({ params: mongoIdParamSchema }), deleteListing);
listingRouter.patch("/:id/mark-sold", authenticate, validate({ params: mongoIdParamSchema }), markSold);
