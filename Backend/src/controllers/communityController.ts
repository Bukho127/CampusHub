import type { Request, Response } from "express";
import { CommunityPost } from "../models/CommunityPost";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

export const getCommunityPosts = asyncHandler(async (_req: Request, res: Response) => {
  const posts = await CommunityPost.find().populate("author", "displayName identityType location").sort({ createdAt: -1 });
  sendSuccess(res, { posts });
});

export const getCommunityPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await CommunityPost.findById(req.params.id).populate("author", "displayName identityType location");

  if (!post) {
    throw new AppError("Community post not found", 404);
  }

  sendSuccess(res, { post });
});

export const createCommunityPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await CommunityPost.create({
    ...req.body,
    author: req.user?.id
  });

  await post.populate("author", "displayName identityType location");
  sendSuccess(res, { post }, "Community post created", 201);
});
