import { fetchCommunityPosts } from "../api/communityApi";
import type { BackendCommunityPost } from "../api/types";
import { communityPosts as mockCommunityPosts } from "../mocks/marketplace";
import type { CommunityPost } from "../models/marketplace";

function mapCommunityPost(post: BackendCommunityPost): CommunityPost {
  return {
    id: post._id,
    title: post.title,
    summary: post.summary,
    type: post.type,
    dateLabel: post.dateLabel
  };
}

export async function getCommunityPosts() {
  return fetchCommunityPosts()
    .then((posts) => posts.map(mapCommunityPost))
    .catch(() => mockCommunityPosts);
}
