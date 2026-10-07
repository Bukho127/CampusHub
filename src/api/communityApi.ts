import { apiRequest } from "./client";
import type { BackendCommunityPost } from "./types";

export type CommunityPostPayload = {
  title: string;
  summary: string;
  body: string;
  type: "announcement" | "event" | "service";
  dateLabel: string;
  image?: {
    uri: string;
    name: string;
    type: string;
  };
};

export async function fetchCommunityPosts(token?: string | null) {
  const response = await apiRequest<{ posts: BackendCommunityPost[]; featuredPost: BackendCommunityPost | null }>("/community-posts", { token: token ?? undefined });
  return response.data;
}

export async function fetchCommunityPostById(id: string, token?: string | null) {
  const response = await apiRequest<{ post: BackendCommunityPost }>(`/community-posts/${id}`, { token: token ?? undefined });
  return response.data.post;
}

export async function createCommunityPostApi(payload: CommunityPostPayload, token: string) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("summary", payload.summary);
  formData.append("body", payload.body);
  formData.append("type", payload.type);
  formData.append("dateLabel", payload.dateLabel);
  if (payload.image) {
    formData.append("image", payload.image as unknown as Blob);
  }

  const response = await apiRequest<{ post: BackendCommunityPost }>("/community-posts", {
    method: "POST",
    token,
    body: formData
  });
  return response.data.post;
}

export async function toggleCommunityPostLikeApi(id: string, token: string) {
  const response = await apiRequest<{ post: BackendCommunityPost }>(`/community-posts/${id}/like`, {
    method: "POST",
    token
  });
  return response.data.post;
}

export async function addCommunityPostCommentApi(id: string, body: string, token: string) {
  const response = await apiRequest<{ post: BackendCommunityPost }>(`/community-posts/${id}/comments`, {
    method: "POST",
    token,
    body: JSON.stringify({ body })
  });
  return response.data.post;
}
