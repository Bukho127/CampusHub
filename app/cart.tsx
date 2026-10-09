import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AssetSlotView } from "../src/components/AssetSlotView";
import { EmptyState } from "../src/components/EmptyState";
import { useCart } from "../src/contexts/CartContext";
import { colors, radii, spacing } from "../src/theme/theme";
import { formatRand } from "../src/utils/money";
import { getEffectivePriceCents } from "../src/utils/pricing";

export default function CartScreen() {
  const router = useRouter();
  const { addItem, clearCart, decrementItem, getAvailableQuantity, itemCount, items, removeItem, subtotalCents } = useCart();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.roundButton}>
          <Feather name="chevron-left" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>Cart</Text>
        <Pressable accessibilityLabel="Clear cart" disabled={!items.length} onPress={clearCart} style={[styles.roundButton, !items.length && styles.disabled]}>
          <Feather name="trash-2" size={19} color={colors.ink} />
        </Pressable>
      </View>

      {items.length ? (
        <>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {items.map(({ listing, quantity }) => {
              const image = listing.images[0];
              const availableQuantity = getAvailableQuantity(listing);
              const atQuantityLimit = listing.type === "goods" && quantity >= availableQuantity;
              return (
                <View key={listing.id} style={styles.item}>
                  <Pressable accessibilityRole="button" onPress={() => router.push(`/product/${listing.id}`)} style={styles.imageWrap}>
                    <AssetSlotView slot={image?.slot ?? "notebook"} uri={image?.url} height={88} rounded={radii.sm} />
                  </Pressable>
                  <View style={styles.itemBody}>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemText}>
                        <Text numberOfLines={2} style={styles.itemTitle}>{listing.title}</Text>
                        <Text style={styles.itemMeta}>
                          {listing.location}
                          {listing.type === "goods" ? ` - ${availableQuantity} available` : ""}
                        </Text>
                      </View>
                      <Pressable accessibilityLabel={`Remove ${listing.title}`} onPress={() => removeItem(listing.id)} style={styles.removeButton}>
                        <Feather name="x" size={18} color={colors.muted} />
                      </Pressable>
                    </View>
                    <View style={styles.itemFooter}>
                      <View>
                        <Text style={styles.price}>{formatRand(getEffectivePriceCents(listing) * quantity)}</Text>
                        {listing.discountPercent ? <Text style={styles.originalPrice}>{formatRand(listing.priceCents * quantity)} before discount</Text> : null}
                      </View>
                      <View style={styles.stepper}>
                        <Pressable accessibilityLabel="Decrease quantity" onPress={() => decrementItem(listing.id)} style={styles.stepperButton}>
                          <Feather name="minus" size={16} color={colors.ink} />
                        </Pressable>
                        <Text style={styles.quantity}>{quantity}</Text>
                        <Pressable
                          accessibilityLabel={atQuantityLimit ? `Only ${availableQuantity} available` : "Increase quantity"}
                          disabled={atQuantityLimit}
                          onPress={() => addItem(listing)}
                          style={[styles.stepperButton, atQuantityLimit && styles.stepperButtonDisabled]}
                        >
                          <Feather name="plus" size={16} color={atQuantityLimit ? colors.subtle : colors.ink} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items</Text>
              <Text style={styles.summaryValue}>{itemCount}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryTotal}>{formatRand(subtotalCents)}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => router.push("/checkout")} style={styles.checkoutButton}>
              <Text style={styles.checkoutText}>Checkout</Text>
            </Pressable>
            <Text style={styles.note}>Choose a simulated CampusHub payment method before placing the order.</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyWrap}>
          <EmptyState title="Your cart is empty" message="Add campus goods from product pages and they will appear here." />
          <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/explore")} style={styles.shopButton}>
            <Text style={styles.shopButtonText}>Browse listings</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.lg,
    paddingBottom: spacing.sm
  },
  roundButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "700"
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl
  },
  item: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  imageWrap: {
    width: 92
  },
  itemBody: {
    flex: 1,
    gap: spacing.md
  },
  itemHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm
  },
  itemText: {
    flex: 1
  },
  itemTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20
  },
  itemMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3
  },
  removeButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  },
  itemFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  price: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700"
  },
  originalPrice: { color: colors.muted, fontSize: 11, textDecorationLine: "line-through" },
  stepper: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.sm,
    padding: 4
  },
  stepperButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  stepperButtonDisabled: {
    opacity: 0.42
  },
  quantity: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600",
    minWidth: 18,
    textAlign: "center"
  },
  summary: {
    backgroundColor: colors.white,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg
  },
  summaryRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 14
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600"
  },
  summaryTotal: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "700"
  },
  checkoutButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    justifyContent: "center",
    marginTop: spacing.sm,
    minHeight: 50
  },
  checkoutText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600"
  },
  note: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center"
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl
  },
  shopButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    justifyContent: "center",
    marginTop: spacing.lg,
    minHeight: 48
  },
  shopButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600"
  },
  disabled: {
    opacity: 0.58
  }
});
