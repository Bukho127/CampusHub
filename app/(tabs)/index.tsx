import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AssetSlotView } from "../../src/components/AssetSlotView";
import { CategoryChip } from "../../src/components/CategoryChip";
import { ProductCard } from "../../src/components/ProductCard";
import { SearchBar } from "../../src/components/SearchBar";
import { SectionHeader } from "../../src/components/SectionHeader";
import { useAuth } from "../../src/contexts/AuthContext";
import { useCart } from "../../src/contexts/CartContext";
import type { Category, CommunityPost, Listing, Seller } from "../../src/models/marketplace";
import { getCommunityPosts } from "../../src/services/communityService";
import { getCategories, getListings, getSellers } from "../../src/services/productService";
import { colors, radii, spacing } from "../../src/theme/theme";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { itemCount } = useCart();
  const greetingName = user?.firstName?.trim() || user?.displayName?.trim().split(/\s+/)[0] || "there";
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [recent, setRecent] = useState<Listing[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      getCategories().then((items) => { if (active) setCategories(items); }).catch(() => { if (active) setCategories([]); });
      getCommunityPosts().then((result) => { if (active) setCommunityPosts(result.posts); }).catch(() => { if (active) setCommunityPosts([]); });
      getSellers().then((items) => { if (active) setSellers(items); }).catch(() => { if (active) setSellers([]); });
      getListings({ sort: "rating" }).then((items) => { if (active) setFeatured(items.slice(0, 4)); }).catch(() => { if (active) setFeatured([]); });
      getListings({ sort: "newest" }).then((items) => { if (active) setRecent(items.slice(0, 4)); }).catch(() => { if (active) setRecent([]); });

      return () => {
        active = false;
      };
    }, [])
  );

  const sellerMap = useMemo(() => new Map(sellers.map((seller) => [seller.id, seller])), [sellers]);

  function submitSearch() {
    router.push({ pathname: "/(tabs)/explore", params: { q: search } });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.greeting}>Hi, {greetingName}</Text>
            <Text style={styles.subGreeting}>Find campus deals near you</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable accessibilityLabel="Open notifications" style={styles.iconButton}>
              <Feather name="bell" size={21} color={colors.ink} />
              <View style={styles.notificationDot} />
            </Pressable>
            <Pressable accessibilityLabel="Open cart" onPress={() => router.push("/cart")} style={styles.iconButton}>
              <Feather name="shopping-bag" size={21} color={colors.ink} />
              {itemCount > 0 ? (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{itemCount > 9 ? "9+" : itemCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>

        <View style={styles.searchRow}>
          <SearchBar value={search} onChangeText={setSearch} onSubmit={submitSearch} />
          <Pressable accessibilityLabel="Open filters" onPress={() => router.push("/(tabs)/explore")} style={styles.filterButton}>
            <Feather name="sliders" size={20} color={colors.ink} />
          </Pressable>
        </View>

        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CategoryChip
              label={item.name}
              selected={item.id === "all"}
              onPress={() => router.push({ pathname: "/(tabs)/explore", params: { category: item.id } })}
            />
          )}
          contentContainerStyle={styles.categoryList}
          showsHorizontalScrollIndicator={false}
        />

        <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/community")} style={styles.hero}>
          <AssetSlotView slot="heroMarket" height={212} rounded={radii.lg} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroBrand}>
            <View style={styles.logoBubble}>
              <Image source={require("../../assets/campus-logo.png")} style={styles.logoImage} resizeMode="contain" />
            </View>
            <View>
              <Text style={styles.heroBrandTitle}>Community Store</Text>
              <Text style={styles.heroBrandMeta}>15K campus users</Text>
            </View>
          </View>
          <Pressable accessibilityLabel="Favorite announcement" style={styles.heroHeart}>
            <Feather name="heart" size={18} color={colors.ink} />
          </Pressable>
          <Text style={styles.heroTitle}>Talent Show Coming soon</Text>
        </Pressable>

        <SectionHeader title="Featured nearby" action="See all" />
        <FlatList
          horizontal
          data={featured}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard listing={item} seller={sellerMap.get(item.sellerId)} />}
          contentContainerStyle={styles.productRow}
          showsHorizontalScrollIndicator={false}
        />

        <SectionHeader title="Recently listed" />
        <FlatList
          horizontal
          data={recent}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard listing={item} seller={sellerMap.get(item.sellerId)} />}
          contentContainerStyle={styles.productRow}
          showsHorizontalScrollIndicator={false}
        />

        <SectionHeader title="Community deals" />
        {communityPosts.map((post) => (
          <View key={post.id} style={styles.post}>
            <View>
              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postSummary}>{post.summary}</Text>
            </View>
            <Text style={styles.postDate}>{post.dateLabel}</Text>
          </View>
        ))}
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
    paddingBottom: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22
  },
  greeting: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900"
  },
  subGreeting: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 3
  },
  headerActions: {
    flexDirection: "row",
    gap: 8
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  notificationDot: {
    backgroundColor: colors.danger,
    borderRadius: 5,
    height: 10,
    position: "absolute",
    right: 11,
    top: 10,
    width: 10
  },
  cartBadge: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderColor: colors.white,
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 20,
    justifyContent: "center",
    minWidth: 20,
    paddingHorizontal: 4,
    position: "absolute",
    right: 4,
    top: 2
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "900"
  },
  searchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 22
  },
  filterButton: {
    alignItems: "center",
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center"
  },
  categoryList: {
    gap: 10,
    paddingBottom: 30
  },
  hero: {
    borderRadius: radii.lg,
    marginBottom: 26,
    overflow: "hidden"
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 15, 8, 0.38)"
  },
  heroBrand: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    left: 22,
    position: "absolute",
    top: 22
  },
  logoBubble: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    height: 39,
    justifyContent: "center",
    padding: 6,
    width: 39
  },
  logoImage: {
    height: "100%",
    width: "100%"
  },
  heroBrandTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900"
  },
  heroBrandMeta: {
    color: "#eeeeee",
    fontSize: 11
  },
  heroHeart: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    height: 38,
    justifyContent: "center",
    position: "absolute",
    right: 18,
    top: 24,
    width: 38
  },
  heroTitle: {
    bottom: 42,
    color: colors.white,
    fontSize: 31,
    fontWeight: "900",
    left: 28,
    lineHeight: 35,
    position: "absolute",
    width: 276
  },
  productRow: {
    gap: 14,
    paddingBottom: 24
  },
  post: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
    paddingVertical: 14
  },
  postTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800"
  },
  postSummary: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    maxWidth: 250
  },
  postDate: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800"
  }
});
