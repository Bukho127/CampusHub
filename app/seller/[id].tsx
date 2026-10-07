import { Feather, FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, Vibration, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../../src/api/client";
import { deleteListingApi } from "../../src/api/marketplaceApi";
import { fetchSellerReviews, createSellerReview } from "../../src/api/reviewsApi";
import { reportSellerApi } from "../../src/api/reportsApi";
import { Badge } from "../../src/components/Badge";
import { CategoryChip } from "../../src/components/CategoryChip";
import { VerificationBadge } from "../../src/components/VerificationBadge";
import { EmptyState } from "../../src/components/EmptyState";
import { ProfileAvatar } from "../../src/components/ProfileAvatar";
import { ProductCard } from "../../src/components/ProductCard";
import { useAuth } from "../../src/contexts/AuthContext";
import type { BackendReview } from "../../src/api/types";
import type { Listing, Seller } from "../../src/models/marketplace";
import { getListingsBySeller, getSellerById } from "../../src/services/productService";
import { colors, radii, spacing } from "../../src/theme/theme";

const AnimatedStar = Animated.createAnimatedComponent(FontAwesome);

function RatingStar({ onSelect, selected, value }: { onSelect: (value: number) => void; selected: boolean; value: number }) {
  const scale = useRef(new Animated.Value(1)).current;

  function press() {
    Vibration.vibrate(12);
    onSelect(value);
    Animated.sequence([
      Animated.timing(scale, { duration: 90, toValue: 1.28, useNativeDriver: true }),
      Animated.spring(scale, { friction: 4, tension: 180, toValue: 1, useNativeDriver: true })
    ]).start();
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Set rating to ${value} out of 5 stars`}
      accessibilityState={{ selected }}
      onPress={press}
      style={styles.starButton}
    >
      <AnimatedStar
        name={selected ? "star" : "star-o"}
        size={42}
        color={selected ? colors.accent : colors.line}
        style={{ transform: [{ scale }] }}
      />
    </Pressable>
  );
}

export default function SellerProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<BackendReview[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportError, setReportError] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [listingError, setListingError] = useState("");
  const viewerId = user?.id ?? user?._id;
  const isOwnProfile = Boolean(viewerId && seller?.id === viewerId);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!id) return;
      try {
        const found = await getSellerById(id);
        if (!active) return;
        setSeller(found);
        if (found) {
          const sellerListings = await getListingsBySeller(found.id);
          if (active) setListings(sellerListings);
        }
      } catch {
        if (active) setSeller(null);
      } finally {
        if (active) setLoaded(true);
      }
    }
    void load();
    fetchSellerReviews(id).then((items) => {
      if (active) setReviews(items);
    }).catch(() => {
      if (active) setReviewError("Could not load public reviews.");
    });
    return () => {
      active = false;
    };
  }, [id]);

  async function submitReview() {
    setReviewError("");
    setReviewMessage("");
    if (!token) {
      router.push("/(auth)/login");
      return;
    }
    if (comment.trim().length < 3) {
      setReviewError("Write at least 3 characters for your review.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const created = await createSellerReview(id, rating, comment.trim(), token);
      setReviews((current) => [created, ...current]);
      setComment("");
      setReviewMessage("Your review is now public on this seller profile.");
      setSeller((current) => {
        if (!current) return current;
        const count = current.reviewCount + 1;
        const average = ((current.rating ?? 0) * current.reviewCount + rating) / count;
        return { ...current, rating: Math.round(average * 10) / 10, reviewCount: count };
      });
    } catch (caught) {
      setReviewError(caught instanceof ApiError ? caught.message : "Could not submit your review.");
    } finally {
      setIsSubmittingReview(false);
    }
  }

  async function submitReport() {
    setReportError("");
    setReportMessage("");
    if (!token) {
      router.push("/(auth)/login");
      return;
    }
    if (!reportReason) {
      setReportError("Choose a reason for reporting this seller.");
      return;
    }

    setIsSubmittingReport(true);
    try {
      await reportSellerApi(id, reportReason, reportDetails, token);
      setReportMessage("Report submitted privately. It will not appear on the public seller profile.");
      setShowReportForm(false);
      setReportReason("");
      setReportDetails("");
    } catch (caught) {
      setReportError(caught instanceof ApiError ? caught.message : "Could not submit this report.");
    } finally {
      setIsSubmittingReport(false);
    }
  }

  function confirmDeleteListing(listing: Listing) {
    if (!token) return;
    setListingError("");

    Alert.alert("Delete listing?", `${listing.title} will be removed from the marketplace.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteListingApi(listing.id, token);
            setListings((current) => current.filter((item) => item.id !== listing.id));
          } catch (caught) {
            setListingError(caught instanceof ApiError ? caught.message : "Could not delete this listing.");
          }
        }
      }
    ]);
  }

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
          <ProfileAvatar uri={seller.avatarUrl} size={82} iconSize={34} />
          <View style={styles.profileText}>
            <Text style={styles.name}>{seller.displayName}</Text>
            <Text style={styles.meta}>
              {seller.identityType} - {seller.location}
            </Text>
            <View style={styles.badges}>
              <VerificationBadge verified={seller.verificationState === "verified"} label={seller.verificationLabel ?? seller.verificationState} />
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

        <Text style={styles.sectionTitle}>Reviews ({seller.reviewCount})</Text>
        {!isOwnProfile ? (
          <View style={styles.reviewForm}>
            <Text style={styles.formTitle}>Rate this seller</Text>
            <View style={styles.starPicker}>
              {[1, 2, 3, 4, 5].map((value) => (
                <RatingStar key={value} value={value} selected={value <= rating} onSelect={setRating} />
              ))}
            </View>
            <TextInput
              maxLength={1200}
              multiline
              onChangeText={setComment}
              placeholder="Write a public review"
              placeholderTextColor={colors.subtle}
              style={styles.reviewInput}
              textAlignVertical="top"
              value={comment}
            />
            {reviewError ? <Text accessibilityRole="alert" style={styles.error}>{reviewError}</Text> : null}
            {reviewMessage ? <Text accessibilityRole="alert" style={styles.success}>{reviewMessage}</Text> : null}
            <Pressable accessibilityRole="button" disabled={isSubmittingReview} onPress={submitReview} style={[styles.actionButton, isSubmittingReview && styles.disabled]}>
              <Text style={styles.actionButtonText}>{isSubmittingReview ? "Submitting..." : token ? "Publish review" : "Sign in to review"}</Text>
            </Pressable>
          </View>
        ) : null}
        {reviewError && !reviews.length ? <Text style={styles.error}>{reviewError}</Text> : null}
        {reviews.map((review) => (
          <View key={review._id} style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewerName}>{review.reviewer.displayName}</Text>
              <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={styles.reviewStars}>
              {[1, 2, 3, 4, 5].map((value) => <FontAwesome key={value} name={value <= review.rating ? "star" : "star-o"} size={16} color={value <= review.rating ? colors.accent : colors.line} />)}
            </View>
            <Text style={styles.reviewComment}>{review.comment}</Text>
          </View>
        ))}

        {!isOwnProfile ? (
          <View style={styles.reportSection}>
            {showReportForm ? (
              <>
                <Text style={styles.formTitle}>Report this seller</Text>
                <Text style={styles.helper}>Reports are private and are not shown publicly.</Text>
                <View style={styles.reasonOptions}>
                  {["Scam or fraud", "Unsafe behavior", "Inappropriate profile", "Other"].map((reason) => (
                    <CategoryChip key={reason} label={reason} selected={reportReason === reason} onPress={() => setReportReason(reason)} />
                  ))}
                </View>
                <TextInput maxLength={1200} multiline onChangeText={setReportDetails} placeholder="Add details (optional)" placeholderTextColor={colors.subtle} style={styles.reviewInput} textAlignVertical="top" value={reportDetails} />
                {reportError ? <Text accessibilityRole="alert" style={styles.error}>{reportError}</Text> : null}
                <View style={styles.reportActions}>
                  <Pressable accessibilityRole="button" onPress={() => setShowReportForm(false)} style={styles.cancelButton}><Text style={styles.cancelButtonText}>Cancel</Text></Pressable>
                  <Pressable accessibilityRole="button" disabled={isSubmittingReport} onPress={submitReport} style={[styles.actionButton, isSubmittingReport && styles.disabled]}><Text style={styles.actionButtonText}>{isSubmittingReport ? "Sending..." : token ? "Send report" : "Sign in to report"}</Text></Pressable>
                </View>
              </>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => token ? setShowReportForm(true) : router.push("/(auth)/login")} style={styles.reportButton}>
                <Feather name="flag" size={16} color={colors.muted} />
                <Text style={styles.reportButtonText}>{token ? "Report seller" : "Sign in to report seller"}</Text>
              </Pressable>
            )}
            {reportMessage ? <Text accessibilityRole="alert" style={styles.success}>{reportMessage}</Text> : null}
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Active listings</Text>
        {listingError ? <Text accessibilityRole="alert" style={styles.error}>{listingError}</Text> : null}
        <View style={styles.grid}>
          {listings.map((listing) => (
            <View key={listing.id} style={styles.listingTile}>
              <ProductCard listing={listing} seller={seller} compact />
              {isOwnProfile ? (
                <Pressable accessibilityLabel={`Delete ${listing.title}`} onPress={() => confirmDeleteListing(listing)} style={styles.listingDeleteButton}>
                  <Feather name="trash-2" size={17} color={colors.danger} />
                </Pressable>
              ) : null}
            </View>
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
  reviewForm: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md
  },
  formTitle: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  starPicker: { flexDirection: "row", gap: spacing.sm },
  starButton: { alignItems: "center", justifyContent: "center", minHeight: 58, minWidth: 54 },
  reviewInput: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, color: colors.ink, minHeight: 96, padding: spacing.md },
  actionButton: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radii.pill, justifyContent: "center", minHeight: 44, paddingHorizontal: spacing.lg },
  actionButtonText: { color: colors.white, fontSize: 13, fontWeight: "800" },
  disabled: { opacity: 0.6 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  success: { color: colors.success, fontSize: 13, lineHeight: 18 },
  reviewItem: { borderBottomColor: colors.line, borderBottomWidth: 1, gap: spacing.sm, paddingVertical: spacing.md },
  reviewHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  reviewerName: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  reviewDate: { color: colors.subtle, fontSize: 12 },
  reviewStars: { flexDirection: "row", gap: 2 },
  reviewComment: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  reportSection: { borderTopColor: colors.line, borderTopWidth: 1, gap: spacing.md, marginTop: spacing.xl, paddingTop: spacing.md },
  reportButton: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: spacing.sm, minHeight: 40 },
  reportButtonText: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  helper: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  reasonOptions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  reportActions: { alignItems: "center", flexDirection: "row", gap: spacing.sm, justifyContent: "flex-end" },
  cancelButton: { alignItems: "center", borderColor: colors.line, borderRadius: radii.pill, borderWidth: 1, justifyContent: "center", minHeight: 44, paddingHorizontal: spacing.lg },
  cancelButtonText: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12
  },
  listingTile: {
    flex: 1,
    minWidth: 158,
    position: "relative"
  },
  listingDeleteButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: radii.pill,
    height: 36,
    justifyContent: "center",
    position: "absolute",
    left: 8,
    top: 8,
    width: 36
  }
});
