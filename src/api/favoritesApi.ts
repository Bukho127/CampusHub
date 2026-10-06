import { apiRequest } from "./client";

export async function addFavoriteApi(listingId: string, token: string) {
  await apiRequest(`/favorites/${listingId}`, {
    method: "POST",
    token
  });
}

export async function removeFavoriteApi(listingId: string, token: string) {
  await apiRequest(`/favorites/${listingId}`, {
    method: "DELETE",
    token
  });
}
