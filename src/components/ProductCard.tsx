import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { Listing, Seller } from "../models/marketplace";
import { useCart } from "../contexts/CartContext";
import { colors, radii, spacing } from "../theme/theme";
import { formatRand } from "../utils/money";
import { AssetSlotView } from "./AssetSlotView";
import { DietaryTagBadge } from "./DietaryTagBadge";
import { FavoriteButton } from "./FavoriteButton";

type Props = {
  listing: Listing;
  seller?: Seller;
  compact?: boolean;
};

export function ProductCard({ listing, seller, compact }: Props) {
  const router = useRouter();
  const { isSoldOut } = useCart();
  const image = listing.images[0];
  const soldOut = isSoldOut(listing);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${listing.title}${soldOut ? ", sold out" : ""}`}
      onPress={() => router.push(`/product/${listing.id}`)}
      style={[styles.card, compact && styles.compactCard, soldOut && styles.soldCard]}
    >
      <View>
        {image ? <AssetSlotView slot={image.slot} uri={image.url} height={compact ? 116 : 132} rounded={radii.md} /> : null}
        {soldOut ? (
          <View style={styles.soldPill}>
            <Text style={styles.soldPillText}>Sold out</Text>
          </View>
        ) : null}
        <FavoriteButton listingId={listing.id} unselectedColor={colors.white} style={styles.favorite} />
      </View>
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.title}>
          {listing.title}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {listing.type === "goods" ? listing.condition ?? (listing.categoryId.toLowerCase().includes("food") ? "Food & Bev" : "Goods") : "Service"} - {listing.location}
        </Text>
        {listing.type === "goods" && listing.dietaryTags?.length ? (
          <View style={styles.dietaryTags}>
            {listing.dietaryTags.map((tag) => <DietaryTagBadge key={tag} tag={tag} />)}
          </View>
        ) : null}
        <Text numberOfLines={1} style={styles.seller}>
          {seller?.displayName ?? listing.seller?.displayName ?? "Community seller"}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{formatRand(listing.priceCents)}</Text>
          {listing.rating ? (
            <View style={styles.rating}>
              <Feather name="star" size={12} color={colors.yellow} fill={colors.yellow} />
              <Text style={styles.ratingText}>{listing.rating.toFixed(1)}</Text>
            </View>
          ) : (
            <Text style={styles.unrated}>New</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: "hidden",
    width: 168
  },
  compactCard: {
    flex: 1,
    minWidth: 158,
    width: "auto"
  },
  soldCard: {
    opacity: 0.72
  },
  soldPill: {
    backgroundColor: "rgba(23, 23, 23, 0.86)",
    borderRadius: radii.pill,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: "absolute",
    top: 8
  },
  soldPillText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700"
  },
  favorite: {
    alignItems: "center",
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    position: "absolute",
    right: 4,
    top: 4
  },
  body: {
    gap: 5,
    padding: spacing.md
  },
  title: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    minHeight: 38
  },
  meta: {
    color: colors.muted,
    fontSize: 13
  },
  seller: {
    color: colors.subtle,
    fontSize: 12
  },
  dietaryTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 3
  },
  price: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900"
  },
  rating: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3
  },
  ratingText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  unrated: {
    color: colors.subtle,
    fontSize: 12,
    fontWeight: "700"
  }
});
