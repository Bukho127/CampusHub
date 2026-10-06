import { apiRequest } from "./client";

type FavoriteResponse = {
  favorites: Array<{
    listing: string | { _id: string } | null;
  }>;
};

export async function getFavoriteIdsApi(token: string) {
  const response = await apiRequest<FavoriteResponse>("/favorites", { token });

  return response.data.favorites.flatMap(({ listing }) => {
    if (typeof listing === "string") return [listing];
    return listing ? [listing._id] : [];
  });
}

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
