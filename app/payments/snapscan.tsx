import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, type BarcodeScanningResult, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { placeOrders } from "../../src/api/orderApi";
import { EmptyState } from "../../src/components/EmptyState";
import { useAuth } from "../../src/contexts/AuthContext";
import { useCart } from "../../src/contexts/CartContext";
import { useToast } from "../../src/contexts/ToastContext";
import { colors, radii, spacing } from "../../src/theme/theme";
import { formatRand } from "../../src/utils/money";

const snapBlue = "#00AEEF";

export default function SnapScanPaymentScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { completeOrder, itemCount, items, subtotalCents } = useCart();
  const { showToast } = useToast();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const scanningLocked = useRef(false);

  const completePayment = () => {
    Alert.alert("SnapScan approved", "Your mock SnapScan payment was successful.", [
      {
        text: "Done",
        onPress: () => {
          if (!token) {
            showToast({
              title: "Sign in to checkout",
              message: "Log in so CampusHub can save your order and email the seller.",
              tone: "danger"
            });
            router.push("/(auth)/login");
            return;
          }
          void placeOrders(token, items.map(({ listing, quantity }) => ({ listingId: listing.id, quantity })), "snapscan")
            .then(() => {
              completeOrder();
              showToast({
                title: "Payment complete",
                message: "SnapScan payment was successful. Your order was saved and emails were sent.",
                tone: "success"
              });
              router.replace("/(tabs)");
            })
            .catch((error: unknown) => {
              showToast({
                title: "Order could not be placed",
                message: error instanceof Error ? error.message : "Please review your cart and try again.",
                tone: "danger"
              });
            });
        }
      }
    ]);
  };

  const handleBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    if (scanningLocked.current) return;

    scanningLocked.current = true;
    setScannedData(data);

    Alert.alert(
      "SnapScan code detected",
      "Confirm the scanned QR code to place this mock CampusHub order.",
      [
        {
          text: "Scan again",
          style: "cancel",
          onPress: () => {
            scanningLocked.current = false;
            setScannedData(null);
          }
        },
        {
          text: "Confirm payment",
          onPress: completePayment
        }
      ]
    );
  };

  const renderScanner = () => {
    if (!permission) {
      return (
        <View style={styles.permissionCard}>
          <MaterialCommunityIcons name="camera-outline" size={34} color={snapBlue} />
          <Text style={styles.permissionTitle}>Preparing camera</Text>
          <Text style={styles.permissionCopy}>The scanner is checking camera access.</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.permissionCard}>
          <MaterialCommunityIcons name="camera-outline" size={38} color={snapBlue} />
          <Text style={styles.permissionTitle}>Camera permission needed</Text>
          <Text style={styles.permissionCopy}>Allow camera access so CampusHub can scan a SnapScan QR code.</Text>
          <Pressable accessibilityRole="button" onPress={requestPermission} style={styles.permissionButton}>
            <Text style={styles.permissionButtonText}>Allow camera</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.scannerPanel}>
        <CameraView
          active
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          enableTorch={torchOn}
          facing="back"
          onBarcodeScanned={scannedData ? undefined : handleBarcodeScanned}
          style={styles.camera}
        />
        <View pointerEvents="none" style={styles.scannerOverlay}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <Text style={styles.scanHint}>Align the SnapScan QR inside the frame</Text>
        </View>
        <View style={styles.cameraControls}>
          <Pressable accessibilityRole="button" onPress={() => setTorchOn((current) => !current)} style={styles.cameraPill}>
            <Feather name={torchOn ? "zap-off" : "zap"} size={16} color={colors.white} />
            <Text style={styles.cameraPillText}>{torchOn ? "Torch off" : "Torch on"}</Text>
          </Pressable>
          {scannedData ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                scanningLocked.current = false;
                setScannedData(null);
              }}
              style={styles.cameraPill}
            >
              <Feather name="refresh-cw" size={16} color={colors.white} />
              <Text style={styles.cameraPillText}>Scan again</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.roundButton}>
          <Feather name="chevron-left" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>SnapScan</Text>
        <View style={styles.roundButtonGhost} />
      </View>

      {items.length ? (
        <>
          <View style={styles.content}>
            {renderScanner()}

            <View style={styles.summary}>
              <View>
                <Text style={styles.summaryLabel}>CampusHub order</Text>
                <Text style={styles.summaryTitle}>{itemCount} {itemCount === 1 ? "item" : "items"}</Text>
              </View>
              <Text style={styles.summaryTotal}>{formatRand(subtotalCents)}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              disabled={!scannedData}
              onPress={completePayment}
              style={[styles.payButton, !scannedData && styles.payButtonDisabled]}
            >
              <MaterialCommunityIcons name="qrcode-scan" size={20} color={colors.white} />
              <Text style={styles.payButtonText}>{scannedData ? "Confirm scanned payment" : "Scan QR to continue"}</Text>
            </Pressable>
            <Text style={styles.disclaimer}>The camera scans a real QR code. Payment confirmation is still mocked.</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyWrap}>
          <EmptyState title="No SnapScan order" message="Add items to your cart before opening SnapScan checkout." />
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
  roundButtonGhost: {
    height: 44,
    width: 44
  },
  title: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: "900"
  },
  content: {
    flex: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl
  },
  permissionCard: {
    alignItems: "center",
    backgroundColor: "rgba(0, 174, 239, 0.1)",
    borderColor: "rgba(0, 174, 239, 0.22)",
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.xl
  },
  permissionTitle: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: "900"
  },
  permissionCopy: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 280,
    textAlign: "center"
  },
  permissionButton: {
    alignItems: "center",
    backgroundColor: snapBlue,
    borderRadius: radii.pill,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: spacing.xl
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900"
  },
  scannerPanel: {
    backgroundColor: colors.ink,
    borderRadius: radii.lg,
    flex: 1,
    minHeight: 430,
    overflow: "hidden"
  },
  camera: {
    ...StyleSheet.absoluteFillObject
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl
  },
  scanFrame: {
    height: 250,
    position: "relative",
    width: 250
  },
  corner: {
    borderColor: snapBlue,
    height: 44,
    position: "absolute",
    width: 44
  },
  cornerTopLeft: {
    borderLeftWidth: 5,
    borderTopWidth: 5,
    left: 0,
    top: 0
  },
  cornerTopRight: {
    borderRightWidth: 5,
    borderTopWidth: 5,
    right: 0,
    top: 0
  },
  cornerBottomLeft: {
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    bottom: 0,
    left: 0
  },
  cornerBottomRight: {
    borderBottomWidth: 5,
    borderRightWidth: 5,
    bottom: 0,
    right: 0
  },
  scanHint: {
    backgroundColor: "rgba(0, 0, 0, 0.52)",
    borderRadius: radii.pill,
    color: colors.white,
    fontSize: 13,
    fontWeight: "800",
    marginTop: spacing.xl,
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlign: "center"
  },
  cameraControls: {
    bottom: spacing.lg,
    flexDirection: "row",
    gap: spacing.sm,
    left: spacing.lg,
    position: "absolute",
    right: spacing.lg
  },
  cameraPill: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.58)",
    borderColor: "rgba(255, 255, 255, 0.22)",
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.md
  },
  cameraPillText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900"
  },
  summary: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.lg
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  summaryTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 3
  },
  summaryTotal: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900"
  },
  footer: {
    backgroundColor: colors.white,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg
  },
  payButton: {
    alignItems: "center",
    backgroundColor: snapBlue,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 52
  },
  payButtonDisabled: {
    opacity: 0.5
  },
  payButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900"
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
    fontWeight: "900"
  }
});
