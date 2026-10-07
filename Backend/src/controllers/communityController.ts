import type { Request, Response } from "express";
import { CommunityPost } from "../models/CommunityPost";
import { fileToStoredImage } from "../services/uploadService";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

const communityPopulate = [
  { path: "author", select: "displayName identityType location avatar" },
  { path: "comments.author", select: "displayName identityType avatar" }
];

function serializePost(post: any, viewerId?: string) {
  const object = typeof post.toObject === "function" ? post.toObject() : post;
  const likedBy = object.likedBy ?? [];
  const comments = object.comments ?? [];

  return {
    ...object,
    likeCount: likedBy.length,
    commentCount: comments.length,
    likedByMe: Boolean(viewerId && likedBy.some((id: unknown) => String(id) === viewerId)),
    likedBy: undefined
  };
}

export const getCommunityPosts = asyncHandler(async (req: Request, res: Response) => {
  const posts = await CommunityPost.find().populate(communityPopulate).sort({ createdAt: -1 });
  const serialized = posts.map((post) => serializePost(post, req.user?.id));
  const featuredPost = [...serialized].sort((a, b) => b.likeCount - a.likeCount || Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] ?? null;

  sendSuccess(res, { posts: serialized, featuredPost });
});

export const getCommunityPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await CommunityPost.findById(req.params.id).populate(communityPopulate);

  if (!post) {
    throw new AppError("Community post not found", 404);
  }

  sendSuccess(res, { post: serializePost(post, req.user?.id) });
});

export const createCommunityPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await CommunityPost.create({
    ...req.body,
    ...(req.file ? { image: fileToStoredImage(req.file, req.body.title) } : {}),
    author: req.user?.id
  });

  await post.populate(communityPopulate);
  sendSuccess(res, { post: serializePost(post, req.user?.id) }, "Community post created", 201);
});

export const toggleCommunityPostLike = asyncHandler(async (req: Request, res: Response) => {
  const post = await CommunityPost.findById(req.params.id);

  if (!post) {
    throw new AppError("Community post not found", 404);
  }

  const userId = req.user?.id ?? "";
  const liked = post.likedBy.some((id) => id.toString() === userId);
  if (liked) {
    post.likedBy = post.likedBy.filter((id) => id.toString() !== userId);
  } else {
    post.likedBy = [...post.likedBy, userId as any];
  }

  await post.save();
  await post.populate(communityPopulate);
  sendSuccess(res, { post: serializePost(post, userId) }, liked ? "Post unliked" : "Post liked");
});

export const addCommunityPostComment = asyncHandler(async (req: Request, res: Response) => {
  const post = await CommunityPost.findById(req.params.id);

  if (!post) {
    throw new AppError("Community post not found", 404);
  }

  post.comments.push({
    author: req.user?.id,
    body: req.body.body
  });
  await post.save();
  await post.populate(communityPopulate);
  sendSuccess(res, { post: serializePost(post, req.user?.id) }, "Comment added", 201);
});
