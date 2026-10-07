import { Feather, FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../src/components/EmptyState";
import { useCart } from "../src/contexts/CartContext";
import { bankProviders, paymentProviders, type IconFamily, type PaymentMethodId } from "../src/payments/paymentProviders";
import { colors, radii, spacing } from "../src/theme/theme";
import { formatRand } from "../src/utils/money";

const campusHubCard = require("../assets/campusHub_card.png");
const defaultPaymentProvider = paymentProviders[0]!;
const defaultBankProvider = bankProviders[0]!;

type ProviderIconProps = {
  color: string;
  family: IconFamily;
  name: string;
  size?: number;
};

function ProviderIcon({ color, family, name, size = 24 }: ProviderIconProps) {
  if (family === "FontAwesome") {
    return <FontAwesome name={name as keyof typeof FontAwesome.glyphMap} size={size} color={color} />;
  }

  if (family === "MaterialCommunityIcons") {
    return <MaterialCommunityIcons name={name as keyof typeof MaterialCommunityIcons.glyphMap} size={size} color={color} />;
  }

  return <Feather name={name as keyof typeof Feather.glyphMap} size={size} color={color} />;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { completeOrder, itemCount, items, subtotalCents } = useCart();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>(defaultPaymentProvider.id);
  const [selectedBank, setSelectedBank] = useState(defaultBankProvider.id);
  const [cardSheetOpen, setCardSheetOpen] = useState(false);
  const [cardForm, setCardForm] = useState({
    cvv: "",
    expiry: "",
    name: "",
    number: ""
  });

  const provider = useMemo(
    () => paymentProviders.find((method) => method.id === selectedMethod) ?? defaultPaymentProvider,
    [selectedMethod]
  );

  const cardNumberDigits = cardForm.number.replace(/\D/g, "");
  const cardReady = cardNumberDigits.length >= 12 && cardForm.name.trim().length > 2 && cardForm.expiry.length === 5 && cardForm.cvv.length >= 3;
  const selectedBankProvider = bankProviders.find((item) => item.id === selectedBank) ?? defaultBankProvider;

  const updateCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    const formatted = digits.replace(/(.{4})/g, "$1 ").trim();
    setCardForm((current) => ({ ...current, number: formatted }));
  };

  const updateExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    setCardForm((current) => ({ ...current, expiry: formatted }));
  };

  const handleContinue = () => {
    if (selectedMethod === "snapscan") {
      router.push("/payments/snapscan");
      return;
    }

    if (selectedMethod === "card") {
      setCardSheetOpen(true);
      return;
    }

    const bank = bankProviders.find((item) => item.id === selectedBank);
    const bankCopy = selectedMethod === "instant_eft" && bank ? ` using ${bank.label}` : "";
    Alert.alert(
      `${provider.shortLabel} ready`,
      `This is wired as a CampusHub payment simulation${bankCopy}. No real money will be processed yet.`,
      [
        { text: "Keep editing", style: "cancel" },
        {
          text: "Place mock order",
          onPress: () => {
            completeOrder();
            router.replace("/(tabs)");
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.roundButton}>
          <Feather name="chevron-left" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>Checkout</Text>
        <View style={styles.roundButtonGhost} />
      </View>

      {items.length ? (
        <>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View>
                  <Text style={styles.eyebrow}>Order summary</Text>
                  <Text style={styles.summaryTitle}>{itemCount} {itemCount === 1 ? "item" : "items"}</Text>
                </View>
                <Text style={styles.summaryTotal}>{formatRand(subtotalCents)}</Text>
              </View>

              <View style={styles.lines}>
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>{formatRand(subtotalCents)}</Text>
                </View>
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>CampusHub fee</Text>
                  <Text style={styles.summaryValue}>R0</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Payment method</Text>
              <Text style={styles.sectionHint}>Choose how this order should be paid.</Text>
            </View>

            <View style={styles.methodList}>
              {paymentProviders.map((method) => {
                const selected = method.id === selectedMethod;
                return (
                  <Pressable
                    accessibilityLabel={`Select ${method.label}`}
                    accessibilityRole="button"
                    key={method.id}
                    onPress={() => setSelectedMethod(method.id)}
                    style={[styles.methodCard, selected && styles.methodCardSelected]}
                  >
                    <View style={styles.providerMark}>
                      {method.asset ? (
                        <Image accessibilityLabel={method.asset.label} resizeMode="contain" source={method.asset.source} style={styles.providerLogo} />
                      ) : (
                        <ProviderIcon color={method.brandColor} family={method.iconFamily} name={method.iconName} />
                      )}
                    </View>
                    <View style={styles.methodCopy}>
                      <Text style={styles.methodTitle}>{method.label}</Text>
                      <Text style={styles.methodDescription}>{method.description}</Text>
                      {method.assets ? (
                        <View style={styles.cardNetworkRow}>
                          {method.assets.map((asset) => (
                            <Image accessibilityLabel={asset.label} key={asset.label} resizeMode="contain" source={asset.source} style={styles.cardNetworkLogo} />
                          ))}
                        </View>
                      ) : null}
                    </View>
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected ? <Feather name="check" size={14} color={colors.white} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {selectedMethod === "instant_eft" ? (
              <View style={styles.bankSection}>
                <Text style={styles.bankTitle}>Select bank</Text>
                <View style={styles.bankGrid}>
                  {bankProviders.map((bank) => {
                    const selected = bank.id === selectedBank;
                    return (
                      <Pressable
                        accessibilityLabel={`Select ${bank.label}`}
                        accessibilityRole="button"
                        key={bank.id}
                        onPress={() => setSelectedBank(bank.id)}
                        style={[
                          styles.bankChip,
                          selected && styles.bankChipSelected
                        ]}
                      >
                        <Image accessibilityLabel={bank.asset.label} resizeMode="contain" source={bank.asset.source} style={styles.bankLogo} />
                        <Text style={styles.bankLabel}>{bank.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.footerTotal}>
              <Text style={styles.footerLabel}>Total</Text>
              <Text style={styles.footerAmount}>{formatRand(subtotalCents)}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={handleContinue}
              style={styles.payButton}
            >
              <ProviderIcon color={colors.white} family={provider.iconFamily} name={provider.iconName} size={20} />
              <Text style={styles.payButtonText}>Continue with {provider.shortLabel}</Text>
            </Pressable>
            <Text style={styles.disclaimer}>Payment flows are simulated until backend payment processing is added.</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyWrap}>
          <EmptyState title="Nothing to checkout" message="Add a listing to your cart before choosing a payment method." />
          <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/explore")} style={styles.shopButton}>
            <Text style={styles.shopButtonText}>Browse listings</Text>
          </Pressable>
        </View>
      )}

      <Modal animationType="slide" onRequestClose={() => setCardSheetOpen(false)} transparent visible={cardSheetOpen}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalRoot}>
          <Pressable accessibilityLabel="Close card form" onPress={() => setCardSheetOpen(false)} style={styles.backdrop} />
          <View style={styles.cardSheet}>
            <View style={styles.sheetHandle} />
            <ScrollView contentContainerStyle={styles.cardSheetContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetTitle}>Card payment</Text>
                  <Text style={styles.sheetSubtitle}>Enter your card details to place a mock order.</Text>
                </View>
                <View style={styles.cardBrandMark}>
                  <MaterialCommunityIcons name="credit-card-outline" size={24} color={colors.white} />
                </View>
              </View>

              <View style={styles.cardPreview}>
                <Image resizeMode="contain" source={campusHubCard} style={styles.cardImage} />
              </View>

              <View style={styles.supportedCardRow}>
                <Text style={styles.supportedCardText}>Supported cards</Text>
                <View style={styles.supportedCardLogos}>
                  {provider.assets?.map((asset) => (
                    <Image accessibilityLabel={asset.label} key={asset.label} resizeMode="contain" source={asset.source} style={styles.supportedCardLogo} />
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Card number</Text>
                <TextInput
                  keyboardType="number-pad"
                  maxLength={19}
                  onChangeText={updateCardNumber}
                  placeholder="4242 4242 4242 4242"
                  placeholderTextColor={colors.subtle}
                  style={styles.input}
                  value={cardForm.number}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Name on card</Text>
                <TextInput
                  autoCapitalize="words"
                  onChangeText={(name) => setCardForm((current) => ({ ...current, name }))}
                  placeholder="Khanya Jakavu"
                  placeholderTextColor={colors.subtle}
                  style={styles.input}
                  value={cardForm.name}
                />
              </View>

              <View style={styles.rowFields}>
                <View style={[styles.formGroup, styles.fieldHalf]}>
                  <Text style={styles.inputLabel}>Expiry</Text>
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={5}
                    onChangeText={updateExpiry}
                    placeholder="MM/YY"
                    placeholderTextColor={colors.subtle}
                    style={styles.input}
                    value={cardForm.expiry}
                  />
                </View>
                <View style={[styles.formGroup, styles.fieldHalf]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={4}
                    onChangeText={(cvv) => setCardForm((current) => ({ ...current, cvv: cvv.replace(/\D/g, "").slice(0, 4) }))}
                    placeholder="123"
                    placeholderTextColor={colors.subtle}
                    secureTextEntry
                    style={styles.input}
                    value={cardForm.cvv}
                  />
                </View>
              </View>

              <View style={styles.sheetTotalRow}>
                <View>
                  <Text style={styles.footerLabel}>Total to pay</Text>
                  <Text style={styles.sheetPaymentMeta}>
                    {selectedMethod === "instant_eft" ? selectedBankProvider.label : provider.label}
                  </Text>
                </View>
                <Text style={styles.footerAmount}>{formatRand(subtotalCents)}</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={!cardReady}
                onPress={() => {
                  setCardSheetOpen(false);
                  Alert.alert("Card approved", "Your mock card payment was successful.", [
                    {
                      text: "Done",
                      onPress: () => {
                        completeOrder();
                        router.replace("/(tabs)");
                      }
                    }
                  ]);
                }}
                style={[styles.submitCardButton, !cardReady && styles.submitCardButtonDisabled]}
              >
                <Text style={styles.submitCardText}>Pay {formatRand(subtotalCents)}</Text>
              </Pressable>
            </ScrollView>
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
  roundButtonGhost: {
    height: 44,
    width: 44
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "700"
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg
  },
  summaryHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase"
  },
  summaryTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "600",
    marginTop: 3
  },
  summaryTotal: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: "700"
  },
  lines: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    gap: spacing.sm,
    paddingTop: spacing.md
  },
  summaryLine: {
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
  sectionHeader: {
    gap: 3
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "600"
  },
  sectionHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  methodList: {
    gap: spacing.md
  },
  methodCard: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 86,
    padding: spacing.md
  },
  methodCardSelected: {
    backgroundColor: colors.surface,
    borderColor: colors.muted
  },
  providerMark: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radii.md,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  providerLogo: {
    height: 34,
    width: 38
  },
  methodCopy: {
    flex: 1,
    gap: 4
  },
  methodTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "600"
  },
  methodDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  cardNetworkRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: 2
  },
  cardNetworkLogo: {
    height: 18,
    width: 38
  },
  radio: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 24,
    justifyContent: "center",
    width: 24
  },
  radioSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink
  },
  bankSection: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  bankTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "600"
  },
  bankGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  bankChip: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  bankChipSelected: {
    backgroundColor: colors.surface,
    borderColor: colors.muted
  },
  bankLogo: {
    height: 24,
    width: 24
  },
  bankLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "600"
  },
  footer: {
    backgroundColor: colors.white,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg
  },
  footerTotal: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  footerLabel: {
    color: colors.muted,
    fontSize: 14
  },
  footerAmount: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "700"
  },
  payButton: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.xs,
    minHeight: 52,
    paddingHorizontal: spacing.lg
  },
  payButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600"
  },
  disclaimer: {
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
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end"
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.36)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  cardSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "94%",
    padding: spacing.lg,
    paddingBottom: spacing.xl
  },
  cardSheetContent: {
    gap: spacing.md
  },
  sheetHandle: {
    alignSelf: "center",
    backgroundColor: colors.line,
    borderRadius: radii.pill,
    height: 5,
    marginBottom: spacing.xs,
    width: 48
  },
  sheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "700"
  },
  sheetSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3
  },
  cardBrandMark: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: radii.md,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  cardPreview: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.md,
    justifyContent: "center"
  },
  cardImage: {
    height: 190,
    width: "100%"
  },
  supportedCardRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  supportedCardText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600"
  },
  supportedCardLogos: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  supportedCardLogo: {
    height: 20,
    width: 42
  },
  formGroup: {
    gap: spacing.xs
  },
  inputLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "600"
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: spacing.md
  },
  rowFields: {
    flexDirection: "row",
    gap: spacing.md
  },
  fieldHalf: {
    flex: 1
  },
  sheetTotalRow: {
    alignItems: "flex-end",
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.md
  },
  sheetPaymentMeta: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2
  },
  submitCardButton: {
    alignItems: "center",
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    justifyContent: "center",
    minHeight: 52
  },
  submitCardButtonDisabled: {
    opacity: 0.45
  },
  submitCardText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600"
  }
});
