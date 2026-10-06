import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { fetchCategories } from "../../src/api/marketplaceApi";
import { createListingApi, type ListingFormPayload } from "../../src/api/listingUploadApi";
import type { BackendCategory, BackendCondition, BackendDietaryTag, BackendListingType } from "../../src/api/types";
import { CategoryChip } from "../../src/components/CategoryChip";
import { useAuth } from "../../src/contexts/AuthContext";
import { categories as fallbackCategories } from "../../src/mocks/marketplace";
import { colors, radii, spacing } from "../../src/theme/theme";

const conditions: BackendCondition[] = ["New", "Like New", "Good", "Fair"];
const dietaryOptions: Array<{ value: BackendDietaryTag; label: string }> = [
  { value: "healthy", label: "Healthy" },
  { value: "vegan", label: "Vegan" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "halal", label: "Halal" }
];
const listingTypes: Array<{ value: BackendListingType; label: string }> = [
  { value: "goods", label: "Item" },
  { value: "service", label: "Service" }
];

type SelectedImage = NonNullable<ListingFormPayload["images"]>[number];

function getFallbackCategories(): BackendCategory[] {
  return fallbackCategories
    .filter((item) => item.id !== "all")
    .map((item) => ({ _id: item.id, name: item.name, slug: item.id }));
}

export default function SellScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [type, setType] = useState<BackendListingType>("goods");
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState<BackendCondition>("Good");
  const [dietaryTags, setDietaryTags] = useState<BackendDietaryTag[]>([]);
  const [quantity, setQuantity] = useState("1");
  const [location, setLocation] = useState(user?.location ?? "");
  const [negotiable, setNegotiable] = useState(false);
  const [tradeEnabled, setTradeEnabled] = useState(false);
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [categoriesError, setCategoriesError] = useState("");
  const [error, setError] = useState("");
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedCategory = categories.find((item) => item.slug === category);
  const isFoodCategory = selectedCategory?.name.toLowerCase().includes("food") ?? category.toLowerCase().includes("food");

  useEffect(() => {
    let active = true;
    fetchCategories()
      .then((items) => {
        if (!active) return;
        const availableCategories = items.length ? items : getFallbackCategories();
        setCategories(availableCategories);
        setCategory(availableCategories[0]?.slug ?? "");
        if (!items.length) setCategoriesError("No server categories are configured. using the available categories instead.");
      })
      .catch(() => {
        if (!active) return;
        const availableCategories = getFallbackCategories();
        setCategories(availableCategories);
        setCategory(availableCategories[0]?.slug ?? "");
        setCategoriesError("Could not load server categories. Using the available categories instead.");
      })
      .finally(() => {
        if (active) setIsLoadingCategories(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function chooseImages() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Allow photo library access to attach listing photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, 8 - images.length),
      quality: 0.8
    });

    if (result.canceled) return;
    const selected = result.assets.slice(0, 8 - images.length).map((asset, index) => ({
      uri: asset.uri,
      name: asset.fileName ?? `listing-photo-${images.length + index + 1}.jpg`,
      type: asset.mimeType ?? "image/jpeg"
    }));
    setImages((current) => [...current, ...selected].slice(0, 8));
    setError("");
  }

  async function submit() {
    setError("");
    if (!token) {
      setError("Log in to publish a listing.");
      return;
    }
    if (!category) {
      setError("Choose a category.");
      return;
    }
    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }

    const priceValue = Number(price.trim().replace(",", "."));
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setError("Enter a valid price.");
      return;
    }
    if (!location.trim()) {
      setError("Enter a pickup or service location.");
      return;
    }

    const quantityValue = Number(quantity);
    if (type === "goods" && (!Number.isInteger(quantityValue) || quantityValue < 0)) {
      setError("Quantity must be a whole number of 0 or more.");
      return;
    }

    const payload: ListingFormPayload = {
      type,
      title: title.trim(),
      description: description.trim(),
      category,
      priceCents: Math.round(priceValue * 100),
      location: location.trim(),
      negotiable,
      ...(type === "goods" ? { ...(!isFoodCategory ? { condition } : {}), ...(isFoodCategory && dietaryTags.length ? { dietaryTags } : {}), quantityAvailable: quantityValue, tradeEnabled } : { serviceMode: "enquiry" }),
      ...(images.length ? { images } : {})
    };

    setIsSubmitting(true);
    try {
      const response = await createListingApi(payload, token);
      setType("goods");
      setCategory(categories[0]?.slug ?? "");
      setTitle("");
      setDescription("");
      setPrice("");
      setCondition("Good");
      setDietaryTags([]);
      setQuantity("1");
      setLocation(user?.location ?? "");
      setNegotiable(false);
      setTradeEnabled(false);
      setImages([]);
      router.push(`/product/${response.data.listing._id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not publish this listing.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <Text style={styles.title}>Create a listing</Text>
          <Text style={styles.body}>Reach people in your campus community.</Text>
        </View>

        {!token ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>Log in to create and manage listings.</Text>
            <Pressable onPress={() => router.push("/(auth)/login")} style={styles.noticeAction}>
              <Text style={styles.noticeActionText}>Log in</Text>
            </Pressable>
          </View>
        ) : null}
        {token ? (
          <View style={styles.trustNotice}>
            <Feather name="shield" size={20} color={user?.campusEmailVerificationStatus === "verified" ? colors.success : colors.accent} />
            <View style={styles.trustCopy}>
              <Text style={styles.trustTitle}>{user?.campusEmailVerificationStatus === "verified" ? "Campus email verified" : "Seller not campus-verified"}</Text>
              <Text style={styles.helper}>{user?.campusEmailVerificationStatus === "verified" ? "Buyers can see you have verified a CPUT email." : "You can list now; buyers will see that verification is pending or incomplete."}</Text>
            </View>
            {user?.campusEmailVerificationStatus !== "verified" ? (
              <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/profile")} style={styles.noticeAction}>
                <Text style={styles.noticeActionText}>Verify</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.label}>Listing type</Text>
        <View style={styles.segmented}>
          {listingTypes.map((option) => (
            <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected: type === option.value }} onPress={() => {
              setType(option.value);
              if (option.value === "service") setDietaryTags([]);
            }} style={[styles.segment, type === option.value && styles.segmentSelected]}>
              <Text style={[styles.segmentText, type === option.value && styles.segmentTextSelected]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Photos <Text style={styles.optional}>(optional, up to 8)</Text></Text>
        <View style={styles.photoRow}>
          {images.map((image, index) => (
            <View key={`${image.uri}-${index}`} style={styles.photoWrap}>
              <Image source={{ uri: image.uri }} style={styles.photo} />
              <Pressable accessibilityLabel="Remove photo" onPress={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} style={styles.removePhoto}>
                <Feather name="x" size={14} color={colors.white} />
              </Pressable>
            </View>
          ))}
          {images.length < 8 ? (
            <Pressable accessibilityRole="button" onPress={chooseImages} style={styles.addPhoto}>
              <Feather name="camera" size={24} color={colors.ink} />
              <Text style={styles.addPhotoText}>Add photos</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.label}>Title</Text>
        <TextInput maxLength={140} onChangeText={setTitle} placeholder="What are you selling?" placeholderTextColor={colors.subtle} style={styles.input} value={title} />

        <Text style={styles.label}>Description</Text>
        <TextInput maxLength={3000} multiline onChangeText={setDescription} placeholder="Share useful details with buyers" placeholderTextColor={colors.subtle} style={[styles.input, styles.descriptionInput]} textAlignVertical="top" value={description} />

        <Text style={styles.label}>Category</Text>
        {isLoadingCategories ? <Text style={styles.helper}>Loading categories...</Text> : null}
        {categoriesError ? <Text style={styles.inlineError}>{categoriesError}</Text> : null}
        <ScrollView horizontal contentContainerStyle={styles.categoryRow} showsHorizontalScrollIndicator={false}>
          {categories.map((item) => (
            <CategoryChip key={item._id} label={item.name} selected={category === item.slug} onPress={() => {
              setCategory(item.slug);
              if (!item.name.toLowerCase().includes("food")) setDietaryTags([]);
            }} />
          ))}
        </ScrollView>

        {type === "goods" && isFoodCategory ? (
          <>
            <Text style={styles.label}>Food attributes</Text>
            <View style={styles.optionRow}>
              {dietaryOptions.map((option) => (
                <CategoryChip
                  key={option.value}
                  label={option.label}
                  selected={dietaryTags.includes(option.value)}
                  onPress={() => setDietaryTags((current) => current.includes(option.value) ? current.filter((tag) => tag !== option.value) : [...current, option.value])}
                />
              ))}
            </View>
            <Text style={styles.helper}>These are seller-provided food attributes. Confirm ingredients and allergens with the seller.</Text>
          </>
        ) : null}

        <Text style={styles.label}>Price (ZAR)</Text>
        <View style={styles.priceInputWrap}>
          <Text style={styles.currency}>R</Text>
          <TextInput keyboardType="decimal-pad" onChangeText={setPrice} placeholder="0.00" placeholderTextColor={colors.subtle} style={styles.priceInput} value={price} />
        </View>

        {type === "goods" && !isFoodCategory ? (
          <>
            <Text style={styles.label}>Condition</Text>
            <View style={styles.optionRow}>
              {conditions.map((option) => (
                <CategoryChip key={option} label={option} selected={condition === option} onPress={() => setCondition(option)} />
              ))}
            </View>
          </>
        ) : null}
        {type === "goods" ? (
          <>
            <Text style={styles.label}>Quantity available</Text>
            <TextInput keyboardType="number-pad" onChangeText={setQuantity} placeholder="1" placeholderTextColor={colors.subtle} style={styles.input} value={quantity} />
          </>
        ) : null}

        <Text style={styles.label}>{type === "goods" ? "Pickup location" : "Service location"}</Text>
        <TextInput maxLength={120} onChangeText={setLocation} placeholder="Campus or area" placeholderTextColor={colors.subtle} style={styles.input} value={location} />

        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.switchTitle}>Price is negotiable</Text>
            <Text style={styles.helper}>Let buyers make an offer.</Text>
          </View>
          <Switch onValueChange={setNegotiable} trackColor={{ false: colors.line, true: colors.accent }} value={negotiable} />
        </View>
        {type === "goods" ? (
          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.switchTitle}>Open to trade</Text>
              <Text style={styles.helper}>Accept item exchanges.</Text>
            </View>
            <Switch onValueChange={setTradeEnabled} trackColor={{ false: colors.line, true: colors.accent }} value={tradeEnabled} />
          </View>
        ) : null}

        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" disabled={isSubmitting || !token} onPress={submit} style={[styles.submitButton, (isSubmitting || !token) && styles.disabled]}>
          <Text style={styles.submitText}>{isSubmitting ? "Publishing..." : "Publish listing"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  heading: { marginBottom: spacing.sm },
  title: { color: colors.ink, fontSize: 24, fontWeight: "900" },
  body: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.xs },
  notice: { alignItems: "center", backgroundColor: colors.surface, borderRadius: radii.md, flexDirection: "row", justifyContent: "space-between", padding: spacing.md },
  noticeText: { color: colors.ink, flex: 1, fontSize: 13 },
  noticeAction: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  noticeActionText: { color: colors.accent, fontSize: 14, fontWeight: "800" },
  trustNotice: { alignItems: "center", backgroundColor: "rgba(241, 90, 36, 0.08)", borderColor: "rgba(241, 90, 36, 0.24)", borderRadius: radii.md, borderWidth: 1, flexDirection: "row", gap: spacing.sm, padding: spacing.md },
  trustCopy: { flex: 1, gap: spacing.xs },
  trustTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  label: { color: colors.ink, fontSize: 14, fontWeight: "700", marginTop: spacing.sm },
  optional: { color: colors.muted, fontSize: 12, fontWeight: "400" },
  segmented: { backgroundColor: colors.surfaceStrong, borderRadius: radii.md, flexDirection: "row", padding: 4 },
  segment: { alignItems: "center", borderRadius: radii.sm, flex: 1, justifyContent: "center", minHeight: 42 },
  segmentSelected: { backgroundColor: colors.white },
  segmentText: { color: colors.muted, fontSize: 14, fontWeight: "700" },
  segmentTextSelected: { color: colors.ink },
  photoRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  photoWrap: { height: 84, position: "relative", width: 84 },
  photo: { borderRadius: radii.sm, height: 84, width: 84 },
  removePhoto: { alignItems: "center", backgroundColor: colors.ink, borderRadius: radii.pill, height: 25, justifyContent: "center", position: "absolute", right: 4, top: 4, width: 25 },
  addPhoto: { alignItems: "center", backgroundColor: "rgba(241, 90, 36, 0.08)", borderColor: colors.accent, borderRadius: radii.sm, borderStyle: "dashed", borderWidth: 1, height: 96, justifyContent: "center", width: 120 },
  addPhotoText: { color: colors.ink, fontSize: 11, marginTop: spacing.xs },
  input: { borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, color: colors.ink, fontSize: 15, minHeight: 48, paddingHorizontal: spacing.md },
  descriptionInput: { minHeight: 112, paddingTop: spacing.md },
  categoryRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  helper: { color: colors.muted, fontSize: 12 },
  inlineError: { color: colors.danger, fontSize: 13 },
  priceInputWrap: { alignItems: "center", borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, flexDirection: "row", minHeight: 48, paddingHorizontal: spacing.md },
  currency: { color: colors.ink, fontSize: 15, fontWeight: "700", marginRight: spacing.sm },
  priceInput: { color: colors.ink, flex: 1, fontSize: 15, minHeight: 46 },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  switchRow: { alignItems: "center", borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm },
  switchCopy: { flex: 1, gap: spacing.xs },
  switchTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  submitButton: { alignItems: "center", backgroundColor: colors.accent, borderRadius: radii.pill, justifyContent: "center", marginTop: spacing.sm, minHeight: 50 },
  submitText: { color: colors.white, fontSize: 15, fontWeight: "800" },
  disabled: { opacity: 0.55 }
});
