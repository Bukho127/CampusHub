import type { ImageSourcePropType } from "react-native";

export type AssetSlot =
  | "logo"
  | "heroMarket"
  | "notebook"
  | "isijokojoko"
  | "calculator"
  | "javaTextbook"
  | "iphone12"
  | "deskChair"
  | "photography";

export const assetSlots: Record<AssetSlot, ImageSourcePropType | null> = {
  logo: null,
  heroMarket: null,
  notebook: null,
  isijokojoko: null,
  calculator: null,
  javaTextbook: null,
  iphone12: null,
  deskChair: null,
  photography: null
};

export const assetLabels: Record<AssetSlot, string> = {
  logo: "Logo",
  heroMarket: "Hero image",
  notebook: "Notebook photo",
  isijokojoko: "Food photo",
  calculator: "Calculator photo",
  javaTextbook: "Textbook photo",
  iphone12: "Phone photo",
  deskChair: "Furniture photo",
  photography: "Service photo"
};
