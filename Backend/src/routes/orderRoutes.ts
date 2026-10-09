import { Router } from "express";
import { createBuyerOrders, listBuyerOrders } from "../controllers/orderController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createOrderSchema } from "../validators/orderValidators";

export const orderRouter = Router();
orderRouter.use(authenticate);
orderRouter.get("/", listBuyerOrders);
orderRouter.post("/", validate({ body: createOrderSchema }), createBuyerOrders);
