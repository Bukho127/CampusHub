import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "../../src/components/Badge";
import { EmptyState } from "../../src/components/EmptyState";
import { ProductCard } from "../../src/components/ProductCard";
import type { Listing, Seller } from "../../src/models/marketplace";
import { getListingsBySeller, getSellerById } from "../../src/services/productService";
import { colors, radii, spacing } from "../../src/theme/theme";

export default function SellerProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const found = await getSellerById(id);
      setSeller(found);
      setListings(found ? await getListingsBySeller(found.id) : []);
      setLoaded(true);
    }
    load();
  }, [id]);

  if (loaded && !seller) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState title="Seller not found" message="This public seller profile is unavailable." />
      </SafeAreaView>
    );
  }

  if (!seller) {
    return <SafeAreaView style={styles.safe} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}>
          <Feather name="chevron-left" size={24} color={colors.ink} />
        </Pressable>

        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Feather name="user" size={34} color={colors.ink} />
          </View>
          <View style={styles.profileText}>
            <Text style={styles.name}>{seller.displayName}</Text>
            <Text style={styles.meta}>
              {seller.identityType} - {seller.location}
            </Text>
            <View style={styles.badges}>
              <Badge label={seller.verificationState} tone={seller.verificationState === "verified" ? "success" : "accent"} />
              <Badge label={seller.sellerType} />
            </View>
          </View>
        </View>

        <Text style={styles.bio}>{seller.bio}</Text>

        <View style={styles.stats}>
          <View>
            <Text style={styles.statValue}>{seller.rating?.toFixed(1) ?? "New"}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View>
            <Text style={styles.statValue}>{seller.reviewCount}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View>
            <Text style={styles.statValue}>{listings.length}</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Active listings</Text>
        <View style={styles.grid}>
          {listings.map((listing) => (
            <ProductCard key={listing.id} listing={listing} seller={seller} compact />
          ))}
        </View>
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
  back: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    height: 44,
    justifyContent: "center",
    marginBottom: 18,
    width: 44
  },
  profileRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.surfaceStrong,
    borderRadius: radii.pill,
    height: 82,
    justifyContent: "center",
    width: 82
  },
  profileText: {
    flex: 1
  },
  name: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900"
  },
  meta: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
    textTransform: "capitalize"
  },
  badges: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10
  },
  bio: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 22
  },
  stats: {
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 22,
    padding: 16
  },
  statValue: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center"
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
    textAlign: "center"
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "900",
    marginTop: 26
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12
  }
});
