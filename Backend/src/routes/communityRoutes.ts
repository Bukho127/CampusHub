import { Router } from "express";
import { addCommunityPostComment, createCommunityPost, deleteCommunityPost, getCommunityPost, getCommunityPosts, toggleCommunityPostLike } from "../controllers/communityController";
import { authenticate, optionalAuthenticate } from "../middleware/auth";
import { uploadCommunityImage } from "../middleware/upload";
import { validate } from "../middleware/validate";
import { mongoIdParamSchema } from "../validators/commonValidators";
import { createCommunityCommentSchema, createCommunityPostSchema } from "../validators/communityValidators";

export const communityRouter = Router();

communityRouter.get("/", optionalAuthenticate, getCommunityPosts);
communityRouter.get("/:id", optionalAuthenticate, validate({ params: mongoIdParamSchema }), getCommunityPost);
communityRouter.post("/", authenticate, uploadCommunityImage, validate({ body: createCommunityPostSchema }), createCommunityPost);
communityRouter.post("/:id/like", authenticate, validate({ params: mongoIdParamSchema }), toggleCommunityPostLike);
communityRouter.post("/:id/comments", authenticate, validate({ params: mongoIdParamSchema, body: createCommunityCommentSchema }), addCommunityPostComment);
communityRouter.delete("/:id", authenticate, validate({ params: mongoIdParamSchema }), deleteCommunityPost);
