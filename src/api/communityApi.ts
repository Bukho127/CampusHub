import { apiRequest } from "./client";
import type { BackendCommunityPost } from "./types";

export async function fetchCommunityPosts() {
  const response = await apiRequest<{ posts: BackendCommunityPost[] }>("/community-posts");
  return response.data.posts;
}

export async function fetchCommunityPostById(id: string) {
  const response = await apiRequest<{ post: BackendCommunityPost }>(`/community-posts/${id}`);
  return response.data.post;
}
