import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CategoryChip } from "../../src/components/CategoryChip";
import { EmptyState } from "../../src/components/EmptyState";
import { ProductCard } from "../../src/components/ProductCard";
import { SearchBar } from "../../src/components/SearchBar";
import type { Category, Listing, ListingCondition, Seller, SellerType, SortMode } from "../../src/models/marketplace";
import { getCategories, getListings, getSellers } from "../../src/services/productService";
import { colors, radii, spacing } from "../../src/theme/theme";

const sortOptions: { id: SortMode; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "newest", label: "Newest" },
  { id: "priceLow", label: "Price Low" },
  { id: "priceHigh", label: "Price High" },
  { id: "rating", label: "Highest Rated" }
];

const conditions: ListingCondition[] = ["New", "Like New", "Good", "Fair"];

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ q?: string; category?: string }>();
  const [query, setQuery] = useState(params.q ?? "");
  const [categoryId, setCategoryId] = useState(params.category ?? "all");
  const [sort, setSort] = useState<SortMode>("recommended");
  const [condition, setCondition] = useState<ListingCondition | undefined>();
  const [sellerType, setSellerType] = useState<SellerType | undefined>();
  const [minRating, setMinRating] = useState<number | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [results, setResults] = useState<Listing[]>([]);

  const sellerMap = useMemo(() => new Map(sellers.map((seller) => [seller.id, seller])), []);
  const activeFilterCount = [condition, sellerType, minRating].filter(Boolean).length;

  useEffect(() => {
    setQuery(params.q ?? "");
  }, [params.q]);

  useEffect(() => {
    setCategoryId(params.category ?? "all");
  }, [params.category]);

  useEffect(() => {
    Promise.all([getCategories(), getSellers()]).then(([categories, sellers]) => {
      setCategories(categories);
      setSellers(sellers);
    });
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
        renderItem={({ item }) => <ProductCard listing={item} seller={sellerMap.get(item.sellerId)} compact />}
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
    paddingBottom: 24,
    paddingHorizontal: spacing.lg
  },
  columns: {
    gap: 12,
    marginBottom: 12
  }
});
