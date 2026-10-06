import { Router } from "express";
import { addFavorite, getFavorites, removeFavorite } from "../controllers/favoriteController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { mongoIdParamSchema } from "../validators/commonValidators";

export const favoriteRouter = Router();

favoriteRouter.use(authenticate);
favoriteRouter.get("/", getFavorites);
favoriteRouter.post("/:id", validate({ params: mongoIdParamSchema }), addFavorite);
favoriteRouter.delete("/:id", validate({ params: mongoIdParamSchema }), removeFavorite);
