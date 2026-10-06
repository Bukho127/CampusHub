import { Router } from "express";
import { reportListing } from "../controllers/reportController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { mongoIdParamSchema } from "../validators/commonValidators";
import { createReportSchema } from "../validators/reportValidators";

export const reportRouter = Router();

reportRouter.post("/listing/:id", authenticate, validate({ params: mongoIdParamSchema, body: createReportSchema }), reportListing);
