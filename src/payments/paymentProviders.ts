import type { ImageSourcePropType } from "react-native";

export type IconFamily = "Feather" | "FontAwesome" | "MaterialCommunityIcons";

export type PaymentMethodId = "snapscan" | "card" | "instant_eft" | "payfast" | "cash";

export type PaymentAsset = {
  label: string;
  source: ImageSourcePropType;
};

export type PaymentProvider = {
  id: PaymentMethodId;
  label: string;
  shortLabel: string;
  description: string;
  iconFamily: IconFamily;
  iconName: string;
  brandColor: string;
  accentColor: string;
  backgroundColor: string;
  asset?: PaymentAsset;
  assets?: PaymentAsset[];
};

export type BankProvider = {
  id: "standard_bank" | "absa" | "nedbank" | "capitec";
  label: string;
  iconFamily: IconFamily;
  iconName: string;
  brandColor: string;
  backgroundColor: string;
  asset: PaymentAsset;
};

export const paymentProviders: PaymentProvider[] = [
  {
    id: "snapscan",
    label: "SnapScan",
    shortLabel: "SnapScan",
    description: "Scan a mock QR code and confirm from your banking app.",
    iconFamily: "MaterialCommunityIcons",
    iconName: "qrcode-scan",
    brandColor: "#00AEEF",
    accentColor: "#0089C8",
    backgroundColor: "rgba(0, 174, 239, 0.1)",
    asset: {
      label: "SnapScan",
      source: require("../../assets/snapScan_icon.png") as ImageSourcePropType
    }
  },
  {
    id: "card",
    label: "Card",
    shortLabel: "Card",
    description: "Use your CampusHub card details for checkout.",
    iconFamily: "MaterialCommunityIcons",
    iconName: "credit-card-outline",
    brandColor: "#1F2937",
    accentColor: "#111827",
    backgroundColor: "rgba(31, 41, 55, 0.1)",
    assets: [
      {
        label: "Visa",
        source: require("../../assets/Visa_icon.png") as ImageSourcePropType
      },
      {
        label: "Mastercard",
        source: require("../../assets/Mastercard_icon.png") as ImageSourcePropType
      }
    ]
  },
  {
    id: "instant_eft",
    label: "Instant EFT",
    shortLabel: "EFT",
    description: "Pick your bank and simulate a secure EFT handoff.",
    iconFamily: "MaterialCommunityIcons",
    iconName: "bank-transfer",
    brandColor: "#6D28D9",
    accentColor: "#4C1D95",
    backgroundColor: "rgba(109, 40, 217, 0.1)",
    asset: {
      label: "Instant EFT",
      source: require("../../assets/instant-eft-icon.png") as ImageSourcePropType
    }
  },
  {
    id: "payfast",
    label: "PayFast Sandbox",
    shortLabel: "PayFast",
    description: "Preview a PayFast-style sandbox payment flow.",
    iconFamily: "MaterialCommunityIcons",
    iconName: "flash-outline",
    brandColor: "#005BAC",
    accentColor: "#F58220",
    backgroundColor: "rgba(0, 91, 172, 0.1)",
    asset: {
      label: "PayFast",
      source: require("../../assets/payfast-seeklogo.png") as ImageSourcePropType
    }
  },
  {
    id: "cash",
    label: "Cash on Collection",
    shortLabel: "Cash",
    description: "Reserve the order and pay the seller when collecting.",
    iconFamily: "MaterialCommunityIcons",
    iconName: "cash",
    brandColor: "#248A52",
    accentColor: "#166534",
    backgroundColor: "rgba(36, 138, 82, 0.1)"
  }
];

export const bankProviders: BankProvider[] = [
  {
    id: "standard_bank",
    label: "Standard Bank",
    iconFamily: "MaterialCommunityIcons",
    iconName: "bank",
    brandColor: "#0033A0",
    backgroundColor: "rgba(0, 51, 160, 0.1)",
    asset: {
      label: "Standard Bank",
      source: require("../../assets/standard_bank_icon.png") as ImageSourcePropType
    }
  },
  {
    id: "absa",
    label: "Absa",
    iconFamily: "MaterialCommunityIcons",
    iconName: "bank",
    brandColor: "#E31B23",
    backgroundColor: "rgba(227, 27, 35, 0.1)",
    asset: {
      label: "Absa",
      source: require("../../assets/Absa_icon.png") as ImageSourcePropType
    }
  },
  {
    id: "nedbank",
    label: "Nedbank",
    iconFamily: "MaterialCommunityIcons",
    iconName: "bank",
    brandColor: "#007A3D",
    backgroundColor: "rgba(0, 122, 61, 0.1)",
    asset: {
      label: "Nedbank",
      source: require("../../assets/Nedbank_icon.png") as ImageSourcePropType
    }
  },
  {
    id: "capitec",
    label: "Capitec",
    iconFamily: "MaterialCommunityIcons",
    iconName: "bank",
    brandColor: "#0066B3",
    backgroundColor: "rgba(0, 102, 179, 0.1)",
    asset: {
      label: "Capitec",
      source: require("../../assets/Capitec_icon.png") as ImageSourcePropType
    }
  }
];
