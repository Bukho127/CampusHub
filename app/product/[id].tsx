import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { notifyServiceRequested } from "../../src/api/notificationApi";
import { AssetSlotView } from "../../src/components/AssetSlotView";
import { Badge } from "../../src/components/Badge";
import { DietaryTagBadge } from "../../src/components/DietaryTagBadge";
import { FavoriteButton } from "../../src/components/FavoriteButton";
import { VerificationBadge } from "../../src/components/VerificationBadge";
import { EmptyState } from "../../src/components/EmptyState";
import { ProfileAvatar } from "../../src/components/ProfileAvatar";
import { ProductCard } from "../../src/components/ProductCard";
import { useAuth } from "../../src/contexts/AuthContext";
import { useCart } from "../../src/contexts/CartContext";
import { useToast } from "../../src/contexts/ToastContext";
import type { Listing, Seller } from "../../src/models/marketplace";
import { getListingById, getListings, getSellerById } from "../../src/services/productService";
import { colors, radii, spacing } from "../../src/theme/theme";
import { formatRand } from "../../src/utils/money";
import { getEffectivePriceCents } from "../../src/utils/pricing";

function formatPreferredTime(value: Date | null) {
  if (!value) return "Choose preferred time";

  return value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [serviceSheetOpen, setServiceSheetOpen] = useState(false);
  const [serviceNote, setServiceNote] = useState("");
  const [preferredTime, setPreferredTime] = useState<Date | null>(null);
  const [isSendingServiceRequest, setIsSendingServiceRequest] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const { isAuthenticated, token } = useAuth();
  const { addItem, getAvailableQuantity, getQuantity, isSoldOut } = useCart();
  const { showToast } = useToast();

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
  const cartQuantity = getQuantity(listing.id);
  const availableQuantity = getAvailableQuantity(listing);
  const soldOut = isSoldOut(listing);
  const reachedQuantityLimit = listing.type === "goods" && cartQuantity >= availableQuantity;
  const serviceReady = serviceNote.trim().length >= 3 && Boolean(preferredTime);

  function closeServiceRequest() {
    setShowTimePicker(false);
    setServiceSheetOpen(false);
  }

  function openServiceRequest() {
    if (!isAuthenticated) {
      router.push("/(auth)/login");
      return;
    }

    setShowTimePicker(false);
    setServiceSheetOpen(true);
  }

  async function submitServiceRequest() {
    if (!listing) return;
    if (!token) {
      closeServiceRequest();
      router.push("/(auth)/login");
      return;
    }

    if (serviceNote.trim().length < 3) {
      showToast({
        title: "Add request details",
        message: "Write a short note so the seller knows what you need.",
        tone: "danger"
      });
      return;
    }

    if (!preferredTime) {
      showToast({
        title: "Choose a time",
        message: "Pick a preferred time before sending the request.",
        tone: "danger"
      });
      return;
    }

    setIsSendingServiceRequest(true);
    try {
      await notifyServiceRequested({
        listingId: listing.id,
        note: serviceNote.trim(),
        preferredTime: preferredTime.toISOString()
      }, token);

      closeServiceRequest();
      setServiceNote("");
      setPreferredTime(null);
      showToast({
        title: "Service request sent",
        message: `The seller has been emailed about ${listing.title} for ${formatPreferredTime(preferredTime)}.`,
        tone: "success"
      });
    } catch (error) {
      showToast({
        title: "Could not send request",
        message: error instanceof Error ? error.message : "Please try again in a moment.",
        tone: "danger"
      });
    } finally {
      setIsSendingServiceRequest(false);
    }
  }

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
              <ProfileAvatar uri={seller.avatarUrl} size={44} iconSize={22} />
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
            <Text style={styles.price}>{formatRand(getEffectivePriceCents(listing))}</Text>
            {listing.discountPercent ? <Text style={styles.originalPrice}>{formatRand(listing.priceCents)} · {listing.discountPercent}% off</Text> : null}
          </View>
          {listing.negotiable ? <Badge label="Negotiable" tone="accent" /> : null}
        </View>

        <View style={styles.badges}>
          {soldOut ? <Badge label="Sold out" tone="dark" /> : null}
          {isFood ? <Badge label="Food & Bev" /> : listing.type === "goods" ? <Badge label={listing.condition ?? "Goods"} /> : <Badge label="Service" />}
          {listing.type === "goods" && !soldOut ? <Badge label={`${availableQuantity} available`} /> : null}
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
          <ProfileAvatar uri={seller?.avatarUrl} size={48} iconSize={24} />
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
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (listing.type === "service") {
              openServiceRequest();
              return;
            }
            addItem(listing);
            showToast({
              title: "Added to basket",
              message: `${listing.title} is now in your cart.`,
              tone: "success"
            });
          }}
          disabled={soldOut || reachedQuantityLimit}
          style={[styles.primaryAction, (soldOut || reachedQuantityLimit) && styles.primaryActionDisabled]}
        >
          <Text style={styles.primaryActionText}>
            {listing.type === "service"
              ? "Request service"
              : soldOut
                ? "Sold out"
                : reachedQuantityLimit
                  ? `In cart (${cartQuantity}/${availableQuantity})`
                  : cartQuantity > 0
                    ? `Add another (${cartQuantity})`
                    : "Add to cart"}
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push("/cart")} style={styles.cartLink}>
          <Text style={styles.demoNote}>
            {listing.type === "service"
              ? "Send a request and the seller can follow up with you."
              : cartQuantity > 0
                ? "View cart"
                : "Checkout and booking are not processed yet."}
          </Text>
        </Pressable>
      </View>

      <Modal animationType="fade" onRequestClose={closeServiceRequest} transparent visible={serviceSheetOpen}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalRoot}>
          <Pressable accessibilityLabel="Close service request" onPress={closeServiceRequest} style={styles.backdrop} />
          <View style={styles.serviceSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleBlock}>
                <Text style={styles.sheetTitle}>Request service</Text>
                <Text style={styles.sheetSubtitle}>{listing.title}</Text>
              </View>
              <Pressable accessibilityLabel="Close service request" onPress={closeServiceRequest} style={styles.sheetCloseButton}>
                <Feather name="x" size={20} color={colors.ink} />
              </Pressable>
            </View>

            <View style={styles.serviceSellerRow}>
              <ProfileAvatar uri={seller?.avatarUrl} size={44} iconSize={22} />
              <View style={styles.serviceSellerText}>
                <Text style={styles.serviceSellerName}>{seller?.displayName ?? "Community seller"}</Text>
                <Text style={styles.serviceSellerMeta}>{seller?.location ?? listing.location}</Text>
              </View>
            </View>

            <View style={styles.serviceField}>
              <Text style={styles.serviceLabel}>What do you need?</Text>
              <TextInput
                multiline
                onChangeText={setServiceNote}
                placeholder="Share a few details about the service you want..."
                placeholderTextColor={colors.subtle}
                style={[styles.serviceInput, styles.serviceNoteInput]}
                textAlignVertical="top"
                value={serviceNote}
              />
            </View>

            <View style={styles.serviceField}>
              <Text style={styles.serviceLabel}>Preferred time</Text>
              <Pressable accessibilityRole="button" onPress={() => setShowTimePicker(true)} style={styles.timePickerButton}>
                <Text style={[styles.timePickerText, !preferredTime && styles.timePickerPlaceholder]}>{formatPreferredTime(preferredTime)}</Text>
                <Feather name="clock" size={18} color={colors.muted} />
              </Pressable>
              {showTimePicker ? (
                <View style={Platform.OS === "ios" ? styles.iosPickerWrap : undefined}>
                  <DateTimePicker
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    mode="time"
                    onChange={(event, selectedDate) => {
                      if (Platform.OS !== "ios") setShowTimePicker(false);
                      if (event.type === "dismissed") return;
                      if (selectedDate) setPreferredTime(selectedDate);
                    }}
                    value={preferredTime ?? new Date()}
                  />
                  {Platform.OS === "ios" ? (
                    <Pressable accessibilityRole="button" onPress={() => setShowTimePicker(false)} style={styles.timePickerDoneButton}>
                      <Text style={styles.timePickerDoneText}>Done</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={isSendingServiceRequest}
              onPress={submitServiceRequest}
              style={[styles.submitServiceButton, (!serviceReady || isSendingServiceRequest) && styles.submitServiceButtonDisabled]}
            >
              <Text style={styles.submitServiceText}>{isSendingServiceRequest ? "Sending..." : "Send request"}</Text>
            </Pressable>
            <Text style={styles.serviceDisclaimer}>The seller will receive your request by email.</Text>
          </View>
        </KeyboardAvoidingView>
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
  originalPrice: { color: colors.muted, fontSize: 13, marginTop: 3, textDecorationLine: "line-through" },
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
  primaryActionDisabled: {
    backgroundColor: colors.muted
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
  cartLink: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 24
  },
  similar: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end"
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.34)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  serviceSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: spacing.md,
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
    gap: spacing.md,
    justifyContent: "space-between"
  },
  sheetTitleBlock: {
    flex: 1
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: "900"
  },
  sheetSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3
  },
  sheetCloseButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  serviceSellerRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  serviceSellerText: {
    flex: 1
  },
  serviceSellerName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900"
  },
  serviceSellerMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  serviceField: {
    gap: spacing.xs
  },
  serviceLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  serviceInput: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  serviceNoteInput: {
    minHeight: 104,
    paddingTop: spacing.md
  },
  timePickerButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  timePickerText: {
    color: colors.ink,
    flex: 1,
    fontSize: 15
  },
  timePickerPlaceholder: {
    color: colors.subtle
  },
  iosPickerWrap: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: "hidden"
  },
  timePickerDoneButton: {
    alignSelf: "flex-end",
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: spacing.md
  },
  timePickerDoneText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800"
  },
  submitServiceButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    justifyContent: "center",
    minHeight: 50
  },
  submitServiceButtonDisabled: {
    opacity: 0.45
  },
  submitServiceText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900"
  },
  serviceDisclaimer: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center"
  }
});
