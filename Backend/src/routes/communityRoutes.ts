import { Router } from "express";
import { createCommunityPost, getCommunityPost, getCommunityPosts } from "../controllers/communityController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { mongoIdParamSchema } from "../validators/commonValidators";
import { createCommunityPostSchema } from "../validators/communityValidators";

export const communityRouter = Router();

communityRouter.get("/", getCommunityPosts);
communityRouter.get("/:id", validate({ params: mongoIdParamSchema }), getCommunityPost);
communityRouter.post("/", authenticate, validate({ body: createCommunityPostSchema }), createCommunityPost);
