import { apiRequest } from "./client";

export type ListingFormPayload = {
  type: "goods" | "service";
  title: string;
  description: string;
  category: string;
  priceCents: number;
  condition?: string;
  quantityAvailable?: number;
  serviceMode?: "enquiry";
  location: string;
  status?: "active" | "sold" | "draft";
  negotiable?: boolean;
  tradeEnabled?: boolean;
  images?: Array<{
    uri: string;
    name: string;
    type: string;
  }>;
};

function buildListingFormData(payload: ListingFormPayload) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (key === "images" || value === undefined) return;
    formData.append(key, String(value));
  });

  payload.images?.forEach((image) => {
    formData.append("images", image as unknown as Blob);
  });

  return formData;
}

export async function createListingApi(payload: ListingFormPayload, token: string) {
  return apiRequest("/listings", {
    method: "POST",
    token,
    body: buildListingFormData(payload)
  });
}

export async function updateListingApi(id: string, payload: Partial<ListingFormPayload>, token: string) {
  return apiRequest(`/listings/${id}`, {
    method: "PATCH",
    token,
    body: buildListingFormData(payload as ListingFormPayload)
  });
}
