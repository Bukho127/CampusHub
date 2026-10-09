import { Router } from "express";
import { sendOrderCompletedNotification, sendServiceCompletedNotification, sendServiceRequestNotification } from "../controllers/notificationController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { orderCompletedSchema, serviceCompletedSchema, serviceRequestSchema } from "../validators/notificationValidators";

export const notificationRouter = Router();

notificationRouter.post("/service-request", authenticate, validate({ body: serviceRequestSchema }), sendServiceRequestNotification);
notificationRouter.post("/order-completed", authenticate, validate({ body: orderCompletedSchema }), sendOrderCompletedNotification);
notificationRouter.post("/service-completed", authenticate, validate({ body: serviceCompletedSchema }), sendServiceCompletedNotification);
