import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AssetSlotView } from "../../src/components/AssetSlotView";
import { Badge } from "../../src/components/Badge";
import { DietaryTagBadge } from "../../src/components/DietaryTagBadge";
import { FavoriteButton } from "../../src/components/FavoriteButton";
import { VerificationBadge } from "../../src/components/VerificationBadge";
import { EmptyState } from "../../src/components/EmptyState";
import { ProductCard } from "../../src/components/ProductCard";
import type { Listing, Seller } from "../../src/models/marketplace";
import { getListingById, getListings, getSellerById } from "../../src/services/productService";
import { colors, radii, spacing } from "../../src/theme/theme";
import { formatRand } from "../../src/utils/money";

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const found = await getListingById(id);
      setListing(found);
      setSeller(found ? found.seller ?? (await getSellerById(found.sellerId)) : null);
      setSimilar(found ? (await getListings({ categoryId: found.categoryId })).filter((item) => item.id !== found.id).slice(0, 2) : []);
      setLoaded(true);
    }
    load();
  }, [id]);

  if (loaded && !listing) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState title="Listing not found" message="This listing may have been removed or sold." />
      </SafeAreaView>
    );
  }

  if (!listing) {
    return <SafeAreaView style={styles.safe} />;
  }

  const image = listing.images[0];
  const displayedRating = seller?.rating ?? listing.rating ?? 0;
  const displayedReviewCount = seller?.reviewCount ?? listing.reviewCount;
  const isFood = listing.type === "goods" && listing.categoryId.toLowerCase().includes("food");

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.roundButton}>
            <Feather name="chevron-left" size={24} color={colors.ink} />
          </Pressable>
          <Pressable accessibilityLabel="Report listing" style={styles.roundButton}>
            <Feather name="flag" size={19} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          {image ? <AssetSlotView slot={image.slot} uri={image.url} height={238} rounded={radii.md} /> : null}
          <FavoriteButton listingId={listing.id} size={22} unselectedColor={colors.ink} style={styles.heroFavorite} />
          {seller ? (
            <Pressable accessibilityLabel={`View ${seller.displayName}'s seller profile`} onPress={() => router.push(`/seller/${seller.id}`)} style={styles.heroSeller}>
              <Feather name="user" size={22} color={colors.ink} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.ratingRow}>
          <View style={styles.ratingStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Feather key={star} name="star" size={16} color={star <= displayedRating ? colors.accent : colors.line} fill={star <= displayedRating ? colors.accent : "transparent"} />
            ))}
          </View>
          <View style={styles.ratingDivider} />
          <Text style={styles.reviewCount}>{displayedReviewCount} {displayedReviewCount === 1 ? "Review" : "Reviews"}</Text>
        </View>

        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{listing.title}</Text>
            <Text style={styles.price}>{formatRand(listing.priceCents)}</Text>
          </View>
          {listing.negotiable ? <Badge label="Negotiable" tone="accent" /> : null}
        </View>

        <View style={styles.badges}>
          {isFood ? <Badge label="Food & Bev" /> : listing.type === "goods" ? <Badge label={listing.condition ?? "Goods"} /> : <Badge label="Service" />}
          {listing.type === "goods" ? listing.dietaryTags?.map((tag) => <DietaryTagBadge key={tag} tag={tag} />) : null}
          {listing.type === "goods" && listing.tradeEnabled ? <Badge label="Trade enabled" tone="success" /> : null}
        </View>

        <Text style={styles.sectionTitle}>{isFood ? "About this food" : "Description"}</Text>
        <Text style={styles.description}>{listing.description}</Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => seller && router.push(`/seller/${seller.id}`)}
          style={styles.sellerCard}
        >
          <View style={styles.sellerAvatar}>
            <Feather name="user" size={24} color={colors.ink} />
          </View>
          <View style={styles.sellerText}>
            <Text style={styles.sellerName}>{seller?.displayName ?? "Community seller"}</Text>
            {seller ? <VerificationBadge verified={seller.verificationState === "verified"} label={seller.verificationLabel ?? seller.verificationState} /> : null}
          </View>
          <Feather name="chevron-right" size={20} color={colors.subtle} />
        </Pressable>

        {similar.length ? (
          <>
            <Text style={styles.sectionTitle}>Similar products</Text>
            <View style={styles.similar}>
              {similar.map((item) => (
                <ProductCard key={item.id} listing={item} compact />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
      <View style={styles.bottomBar}>
        <Pressable accessibilityRole="button" style={styles.primaryAction}>
          <Text style={styles.primaryActionText}>{listing.type === "service" ? "Request service" : "Add to cart"}</Text>
        </Pressable>
        <Text style={styles.demoNote}>Checkout and booking are not processed yet.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md
  },
  roundButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  hero: {
    position: "relative"
  },
  heroFavorite: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: radii.pill,
    position: "absolute",
    right: 10,
    top: 10
  },
  heroSeller: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.white,
    borderRadius: radii.pill,
    borderWidth: 3,
    bottom: 10,
    height: 50,
    justifyContent: "center",
    position: "absolute",
    right: 12,
    width: 50
  },
  ratingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: spacing.md
  },
  ratingStars: { flexDirection: "row", gap: 2 },
  ratingDivider: { backgroundColor: colors.line, height: 19, width: 1 },
  reviewCount: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    marginTop: spacing.md
  },
  titleBlock: {
    flex: 1
  },
  title: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: "900",
    lineHeight: 28
  },
  price: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "900",
    marginTop: 4
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: spacing.sm
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    marginTop: spacing.lg
  },
  description: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
    marginTop: spacing.xs
  },
  sellerCard: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: spacing.lg,
    padding: 14
  },
  sellerAvatar: {
    alignItems: "center",
    backgroundColor: colors.surfaceStrong,
    borderRadius: radii.pill,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  sellerText: {
    flex: 1
  },
  sellerName: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  bottomBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    minHeight: 50,
    justifyContent: "center"
  },
  primaryActionText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900"
  },
  demoNote: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center"
  },
  similar: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12
  }
});
