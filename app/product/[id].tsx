import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AssetSlotView } from "../../src/components/AssetSlotView";
import { Badge } from "../../src/components/Badge";
import { EmptyState } from "../../src/components/EmptyState";
import { ProductCard } from "../../src/components/ProductCard";
import { useFavorites } from "../../src/contexts/FavoritesContext";
import type { Listing, Seller } from "../../src/models/marketplace";
import { getListingById, getListings, getSellerById } from "../../src/services/productService";
import { colors, radii, spacing } from "../../src/theme/theme";
import { formatRand } from "../../src/utils/money";

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const found = await getListingById(id);
      setListing(found);
      setSeller(found ? await getSellerById(found.sellerId) : null);
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

        {image ? <AssetSlotView slot={image.slot} height={300} rounded={radii.lg} /> : null}

        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>{listing.title}</Text>
            <Text style={styles.price}>{formatRand(listing.priceCents)}</Text>
          </View>
          <Pressable accessibilityLabel="Toggle favorite" onPress={() => toggleFavorite(listing.id)} style={styles.favorite}>
            <Feather name="heart" size={22} color={isFavorite(listing.id) ? colors.accent : colors.ink} fill={isFavorite(listing.id) ? colors.accent : "transparent"} />
          </Pressable>
        </View>

        <View style={styles.badges}>
          <Badge label={listing.type === "goods" ? listing.condition : "Service"} />
          <Badge label={listing.location} />
          {listing.negotiable ? <Badge label="Negotiable" tone="accent" /> : null}
          {listing.type === "goods" && listing.tradeEnabled ? <Badge label="Trade enabled" tone="success" /> : null}
        </View>

        <Text style={styles.sectionTitle}>Description</Text>
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
            <Text style={styles.sellerMeta}>
              {seller?.verificationState ?? "unverified"} - {seller?.rating ? `${seller.rating.toFixed(1)} rating` : "No rating yet"}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.subtle} />
        </Pressable>

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>{listing.type === "service" ? "Enquire" : "Add to cart"}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>{listing.type === "service" ? "Request service" : "Buy now"}</Text>
          </Pressable>
        </View>
        <Text style={styles.demoNote}>Checkout, payments, and service booking are planned integrations and are not processed in this demo.</Text>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 32
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16
  },
  roundButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginTop: 20
  },
  titleBlock: {
    flex: 1
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 31
  },
  price: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: "900",
    marginTop: 8
  },
  favorite: {
    alignItems: "center",
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center"
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 26
  },
  description: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 8
  },
  sellerCard: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
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
  sellerMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 3,
    textTransform: "capitalize"
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24
  },
  secondaryAction: {
    alignItems: "center",
    borderColor: colors.ink,
    borderRadius: radii.pill,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    justifyContent: "center"
  },
  secondaryActionText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    flex: 1,
    minHeight: 48,
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
    marginTop: 10
  },
  similar: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12
  }
});
