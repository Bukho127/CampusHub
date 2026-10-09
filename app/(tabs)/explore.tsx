import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AssetSlotView } from "../../src/components/AssetSlotView";
import { CategoryChip } from "../../src/components/CategoryChip";
import { EmptyState } from "../../src/components/EmptyState";
import { FavoriteButton } from "../../src/components/FavoriteButton";
import { SearchBar } from "../../src/components/SearchBar";
import { useCart } from "../../src/contexts/CartContext";
import type { Category, Listing, ListingCondition, SellerType, SortMode } from "../../src/models/marketplace";
import { getCategories, getListings } from "../../src/services/productService";
import { colors, radii, spacing } from "../../src/theme/theme";
import { formatRand } from "../../src/utils/money";

const sortOptions: { id: SortMode; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "newest", label: "Newest" },
  { id: "priceLow", label: "Price Low" },
  { id: "priceHigh", label: "Price High" },
  { id: "rating", label: "Highest Rated" }
];

const conditions: ListingCondition[] = ["New", "Like New", "Good", "Fair"];

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; category?: string }>();
  const { isSoldOut } = useCart();
  const [query, setQuery] = useState(params.q ?? "");
  const [categoryId, setCategoryId] = useState(params.category ?? "all");
  const [sort, setSort] = useState<SortMode>("recommended");
  const [condition, setCondition] = useState<ListingCondition | undefined>();
  const [sellerType, setSellerType] = useState<SellerType | undefined>();
  const [minRating, setMinRating] = useState<number | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<Listing[]>([]);

  const activeFilterCount = [condition, sellerType, minRating].filter(Boolean).length;

  useEffect(() => {
    setQuery(params.q ?? "");
  }, [params.q]);

  useEffect(() => {
    setCategoryId(params.category ?? "all");
  }, [params.category]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    getListings({ query, categoryId, sort, condition, sellerType, minRating }).then(setResults);
  }, [query, categoryId, sort, condition, sellerType, minRating]);

  function resetFilters() {
    setCondition(undefined);
    setSellerType(undefined);
    setMinRating(undefined);
    setSort("recommended");
    setCategoryId("all");
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

  function renderListing({ item }: { item: Listing }) {
    const image = item.images[0];
    const soldOut = isSoldOut(item);

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}${soldOut ? ", sold out" : ""}`}
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
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Pressable accessibilityLabel="Toggle filters" onPress={() => setShowFilters((value) => !value)} style={styles.filterButton}>
          <Feather name="sliders" size={20} color={colors.ink} />
          {activeFilterCount ? <Text style={styles.filterCount}>{activeFilterCount}</Text> : null}
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} />
      </View>

      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CategoryChip label={item.name} selected={categoryId === item.id} onPress={() => setCategoryId(item.id)} />}
        style={styles.categoryList}
        contentContainerStyle={styles.categories}
        showsHorizontalScrollIndicator={false}
      />

      {showFilters ? (
        <View style={styles.filters}>
          <Text style={styles.filterLabel}>Sort</Text>
          <View style={styles.wrap}>
            {sortOptions.map((item) => (
              <CategoryChip key={item.id} label={item.label} selected={sort === item.id} onPress={() => setSort(item.id)} />
            ))}
          </View>

          <Text style={styles.filterLabel}>Condition</Text>
          <View style={styles.wrap}>
            {conditions.map((item) => (
              <CategoryChip key={item} label={item} selected={condition === item} onPress={() => setCondition(condition === item ? undefined : item)} />
            ))}
          </View>

          <Text style={styles.filterLabel}>Seller</Text>
          <View style={styles.wrap}>
            <CategoryChip label="Casual" selected={sellerType === "casual"} onPress={() => setSellerType(sellerType === "casual" ? undefined : "casual")} />
            <CategoryChip label="Vendor" selected={sellerType === "vendor"} onPress={() => setSellerType(sellerType === "vendor" ? undefined : "vendor")} />
            <CategoryChip label="4+ stars" selected={minRating === 4} onPress={() => setMinRating(minRating === 4 ? undefined : 4)} />
          </View>

          <Pressable accessibilityRole="button" onPress={resetFilters} style={styles.reset}>
            <Text style={styles.resetText}>Reset filters</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.results}
        renderItem={renderListing}
        ListEmptyComponent={<EmptyState title="No results" message="Try a different search, category, or filter combination." />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900"
  },
  filterButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: 4,
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    paddingHorizontal: 12
  },
  filterCount: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "900"
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg
  },
  categories: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.lg
  },
  categoryList: {
    flexGrow: 0,
    height: 64
  },
  filters: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    gap: 10,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg
  },
  filterLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  reset: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center"
  },
  resetText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "800"
  },
  results: {
    paddingBottom: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm
  },
  columns: {
    gap: spacing.lg,
    marginBottom: spacing.lg
  },
  listingTile: {
    flex: 1,
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
  }
});
