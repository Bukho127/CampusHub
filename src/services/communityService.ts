import { addCommunityPostCommentApi, createCommunityPostApi, deleteCommunityPostApi, fetchCommunityPosts, toggleCommunityPostLikeApi, type CommunityPostPayload } from "../api/communityApi";
import { toAbsoluteApiUrl } from "../api/config";
import type { BackendCommunityPost, BackendUser } from "../api/types";
import type { CommunityPost } from "../models/marketplace";

function authorName(author: BackendCommunityPost["author"]) {
  if (typeof author === "object" && author) return author.displayName;
  return "Campus member";
}

function authorId(author: BackendCommunityPost["author"]) {
  if (typeof author === "object" && author) return author.id ?? author._id;
  return author;
}

function mapCommunityPost(post: BackendCommunityPost): CommunityPost {
  return {
    id: post._id,
    title: post.title,
    summary: post.summary,
    body: post.body,
    type: post.type,
    dateLabel: post.dateLabel,
    eventDate: post.eventDate,
    eventTime: post.eventTime,
    venue: post.venue,
    imageUrl: post.image?.url ? toAbsoluteApiUrl(post.image.url) : undefined,
    imageAlt: post.image?.alt,
    authorId: authorId(post.author),
    authorName: authorName(post.author),
    likeCount: post.likeCount ?? 0,
    commentCount: post.commentCount ?? post.comments?.length ?? 0,
    likedByMe: Boolean(post.likedByMe),
    comments: (post.comments ?? []).map((comment) => ({
      id: comment._id,
      authorName: typeof comment.author === "object" && comment.author ? (comment.author as BackendUser).displayName : "Campus member",
      body: comment.body,
      createdAt: comment.createdAt
    })),
    createdAt: post.createdAt
  };
}

export async function getCommunityPosts(token?: string | null) {
  const { posts, featuredPost } = await fetchCommunityPosts(token);
  return {
    posts: posts.map(mapCommunityPost),
    featuredPost: featuredPost ? mapCommunityPost(featuredPost) : null
  };
}

export async function createCommunityPost(payload: CommunityPostPayload, token: string) {
  return mapCommunityPost(await createCommunityPostApi(payload, token));
}

export async function toggleCommunityPostLike(id: string, token: string) {
  return mapCommunityPost(await toggleCommunityPostLikeApi(id, token));
}

export async function addCommunityPostComment(id: string, body: string, token: string) {
  return mapCommunityPost(await addCommunityPostCommentApi(id, body, token));
}

export async function deleteCommunityPost(id: string, token: string) {
  await deleteCommunityPostApi(id, token);
}
