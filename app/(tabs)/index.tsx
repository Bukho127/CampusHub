import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AssetSlotView } from "../../src/components/AssetSlotView";
import { CategoryChip } from "../../src/components/CategoryChip";
import { EmptyState } from "../../src/components/EmptyState";
import { FavoriteButton } from "../../src/components/FavoriteButton";
import { SearchBar } from "../../src/components/SearchBar";
import { SectionHeader } from "../../src/components/SectionHeader";
import { useAuth } from "../../src/contexts/AuthContext";
import { useCart } from "../../src/contexts/CartContext";
import type { Category, CommunityPost, Listing } from "../../src/models/marketplace";
import { getCommunityPosts } from "../../src/services/communityService";
import { getCategories, getListings } from "../../src/services/productService";
import { colors, radii, spacing } from "../../src/theme/theme";
import { formatRand } from "../../src/utils/money";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isSoldOut, itemCount } = useCart();
  const greetingName = user?.firstName?.trim() || user?.displayName?.trim().split(/\s+/)[0] || "there";
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [recent, setRecent] = useState<Listing[]>([]);
  const [notificationSheetOpen, setNotificationSheetOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      getCategories().then((items) => { if (active) setCategories(items); }).catch(() => { if (active) setCategories([]); });
      getCommunityPosts().then((result) => { if (active) setCommunityPosts(result.posts); }).catch(() => { if (active) setCommunityPosts([]); });
      getListings({ sort: "rating" }).then((items) => { if (active) setFeatured(items.slice(0, 4)); }).catch(() => { if (active) setFeatured([]); });
      getListings({ sort: "newest" }).then((items) => { if (active) setRecent(items.slice(0, 4)); }).catch(() => { if (active) setRecent([]); });

      return () => {
        active = false;
      };
    }, [])
  );

  function submitSearch() {
    router.push({ pathname: "/(tabs)/explore", params: { q: search } });
  }

  function renderRating(listing: Listing) {
    const rating = listing.rating ?? 0;
    return (
      <View style={styles.listingRating}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Feather
            key={star}
            name="star"
            size={13}
            color={star <= Math.round(rating) ? colors.ink : colors.subtle}
            fill={star <= Math.round(rating) ? colors.ink : "transparent"}
          />
        ))}
        <Text style={styles.listingReviewCount}>{listing.reviewCount || "New"}</Text>
      </View>
    );
  }

  function renderListingGrid(items: Listing[]) {
    return (
      <View style={styles.listingGrid}>
        {items.map((item) => {
          const image = item.images[0];
          const soldOut = isSoldOut(item);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.title}${soldOut ? ", sold out" : ""}`}
              key={item.id}
              onPress={() => router.push(`/product/${item.id}`)}
              style={[styles.listingTile, soldOut && styles.listingTileSold]}
            >
              <View style={styles.listingImageWrap}>
                {image ? <AssetSlotView slot={image.slot} uri={image.url} height={156} rounded={radii.md} /> : null}
                <FavoriteButton listingId={item.id} size={22} unselectedColor={colors.subtle} style={styles.listingFavorite} />
                {soldOut ? (
                  <View style={styles.listingSoldPill}>
                    <Text style={styles.listingSoldText}>Sold out</Text>
                  </View>
                ) : null}
              </View>
              <Text numberOfLines={2} style={styles.listingTitle}>{item.title}</Text>
              <Text numberOfLines={1} style={styles.listingPrice}>{formatRand(item.priceCents)}</Text>
              {renderRating(item)}
            </Pressable>
          );
        })}
      </View>
    );
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
            <Pressable accessibilityLabel="Open notifications" onPress={() => setNotificationSheetOpen(true)} style={styles.iconButton}>
              <Feather name="bell" size={21} color={colors.ink} />
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
        {renderListingGrid(featured)}

        <SectionHeader title="Recently listed" />
        {renderListingGrid(recent)}

        <SectionHeader title="Community deals" />
        <FlatList
          horizontal
          data={communityPosts.slice(0, 6)}
          keyExtractor={(post) => post.id}
          renderItem={({ item }) => (
            <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/community")} style={styles.communityCard}>
              <View style={styles.communityImageWrap}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.communityImage} resizeMode="cover" />
                ) : (
                  <View style={styles.communityImageFallback}>
                    <Feather name="calendar" size={24} color={colors.accent} />
                  </View>
                )}
                <View style={styles.communityType}>
                  <Text style={styles.communityTypeText}>{item.type}</Text>
                </View>
              </View>
              <View style={styles.communityBody}>
                <Text numberOfLines={2} style={styles.postTitle}>{item.title}</Text>
                <Text numberOfLines={2} style={styles.postSummary}>{item.summary}</Text>
                <View style={styles.communityMeta}>
                  <Text numberOfLines={1} style={styles.postDate}>{item.dateLabel}</Text>
                  <View style={styles.communityStat}>
                    <Feather name="heart" size={13} color={colors.accent} />
                    <Text style={styles.communityStatText}>{item.likeCount}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          )}
          contentContainerStyle={styles.communityRow}
          showsHorizontalScrollIndicator={false}
        />
      </ScrollView>

      <Modal animationType="fade" onRequestClose={() => setNotificationSheetOpen(false)} transparent visible={notificationSheetOpen}>
        <View style={styles.notificationModal}>
          <Pressable accessibilityLabel="Close notifications" onPress={() => setNotificationSheetOpen(false)} style={styles.notificationBackdrop} />
          <View style={styles.notificationSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Notifications</Text>
              <Pressable accessibilityLabel="Close notifications" onPress={() => setNotificationSheetOpen(false)} style={styles.sheetCloseButton}>
                <Feather name="x" size={20} color={colors.ink} />
              </Pressable>
            </View>
            <View style={styles.notificationEmpty}>
              <EmptyState title="No notifications yet" message="Updates about orders, listings, and community activity will appear here." />
            </View>
          </View>
        </View>
      </Modal>
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
  listingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    paddingBottom: 28
  },
  listingTile: {
    flexBasis: "47%",
    flexGrow: 1,
    gap: 7,
    maxWidth: "48%"
  },
  listingTileSold: {
    opacity: 0.62
  },
  listingImageWrap: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 156,
    overflow: "hidden",
    position: "relative"
  },
  listingFavorite: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    borderRadius: radii.pill,
    minHeight: 40,
    minWidth: 40,
    position: "absolute",
    right: 6,
    top: 6
  },
  listingSoldPill: {
    backgroundColor: "rgba(23, 23, 23, 0.82)",
    borderRadius: radii.pill,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: "absolute",
    top: 8
  },
  listingSoldText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "800"
  },
  listingTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 20,
    minHeight: 40
  },
  listingPrice: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  listingRating: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3
  },
  listingReviewCount: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 5
  },
  communityRow: {
    gap: 14,
    paddingBottom: 24
  },
  communityCard: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: "hidden",
    width: 168
  },
  communityImageWrap: {
    height: 132,
    position: "relative",
    width: "100%"
  },
  communityImage: {
    height: "100%",
    width: "100%"
  },
  communityImageFallback: {
    alignItems: "center",
    backgroundColor: "rgba(241,90,36,0.1)",
    height: "100%",
    justifyContent: "center",
    width: "100%"
  },
  communityType: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: radii.pill,
    left: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    position: "absolute",
    top: 10
  },
  communityTypeText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "capitalize"
  },
  communityBody: {
    gap: 6,
    padding: spacing.md,
    minHeight: 132
  },
  postTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 19,
    minHeight: 38
  },
  postSummary: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  communityMeta: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2
  },
  postDate: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800"
  },
  communityStat: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  communityStatText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  notificationModal: {
    flex: 1,
    justifyContent: "flex-end"
  },
  notificationBackdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.32)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  notificationSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: spacing.md,
    minHeight: 340,
    padding: spacing.lg,
    paddingBottom: spacing.xl
  },
  sheetHandle: {
    alignSelf: "center",
    backgroundColor: colors.line,
    borderRadius: radii.pill,
    height: 5,
    width: 46
  },
  sheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "800"
  },
  sheetCloseButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  notificationEmpty: {
    flex: 1,
    justifyContent: "center"
  }
});
