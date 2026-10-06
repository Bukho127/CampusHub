import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "../../src/components/Badge";
import { ApiError } from "../../src/api/client";
import { requestCampusEmailVerification } from "../../src/api/authApi";
import { useAuth } from "../../src/contexts/AuthContext";
import { colors, radii, spacing } from "../../src/theme/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, logout, refreshUser, token, user } = useAuth();
  const [campusEmail, setCampusEmail] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  async function requestCampusVerification() {
    setVerificationMessage("");
    setVerificationError("");
    if (!campusEmail.trim().toLowerCase().endsWith("@mycput.ac.za")) {
      setVerificationError("Use your CPUT email address ending in @mycput.ac.za.");
      return;
    }
    if (!token) return;

    setIsSendingVerification(true);
    try {
      await requestCampusEmailVerification(campusEmail.trim().toLowerCase(), token);
      await refreshUser();
      setVerificationMessage("Check your CPUT inbox for a CampusHub verification link. It expires in 30 minutes. If local email delivery is unavailable, check the backend terminal for the development link.");
    } catch (caught) {
      setVerificationError(caught instanceof ApiError ? caught.message : "Could not reach the API server.");
    } finally {
      setIsSendingVerification(false);
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.avatar}>
            <Feather name="user" size={34} color={colors.ink} />
          </View>
          <Text style={styles.name}>Profile</Text>
          <Text style={styles.body}>Sign in to manage your listings, favorites, verification status, purchases, and seller profile.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push("/(auth)/login")} style={styles.primaryButton}>
            <Text style={styles.primaryText}>Login</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push("/(auth)/register")} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Create account</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Feather name="user" size={34} color={colors.ink} />
        </View>
        <Text style={styles.name}>{user.displayName}</Text>
        <Text style={styles.meta}>
          {user.identityType} - {user.location ?? "Campus community"}
        </Text>
        <Badge label={`Email ${user.emailVerificationStatus ?? "unverified"}`} tone={user.emailVerificationStatus === "verified" ? "success" : "accent"} />
        <Badge label={`Vendor ${user.vendorVerificationStatus ?? "unverified"}`} tone={user.vendorVerificationStatus === "verified" ? "success" : "light"} />
        <View style={styles.verificationSection}>
          <Text style={styles.verificationTitle}>Campus seller verification</Text>
          <Badge
            label={`Campus email ${user.campusEmailVerificationStatus ?? "unverified"}`}
            tone={user.campusEmailVerificationStatus === "verified" ? "success" : user.campusEmailVerificationStatus === "pending" ? "accent" : "light"}
          />
          <Text style={styles.helperText}>
            Verifying a CPUT email confirms campus mailbox access. Your campus address is not shown publicly.
          </Text>
          {user.campusEmailVerificationStatus !== "verified" ? (
            <>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setCampusEmail}
                placeholder="Your CPUT email address"
                placeholderTextColor={colors.subtle}
                style={styles.input}
                value={campusEmail}
              />
              {verificationMessage ? <Text accessibilityRole="alert" style={styles.successText}>{verificationMessage}</Text> : null}
              {verificationError ? <Text accessibilityRole="alert" style={styles.errorText}>{verificationError}</Text> : null}
              <Pressable accessibilityRole="button" disabled={isSendingVerification} onPress={requestCampusVerification} style={[styles.verifyButton, isSendingVerification && styles.disabled]}>
                <Text style={styles.verifyButtonText}>{isSendingVerification ? "Sending..." : user.campusEmailVerificationStatus === "pending" ? "Resend verification link" : "Verify campus email"}</Text>
              </Pressable>
              {verificationMessage ? <Pressable onPress={() => router.push("/(auth)/verify-campus-email")}><Text style={styles.tokenLink}>I have a verification token</Text></Pressable> : null}
            </>
          ) : null}
        </View>
        <Text style={styles.body}>
          Unverified sellers can list, but buyers will see their verification status. Campus email verification confirms access to a CPUT mailbox, not the authenticity or quality of an item.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            logout();
            router.replace("/(auth)/login");
          }}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryText}>Logout</Text>
        </Pressable>
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
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.xl
  },
  verificationSection: {
    alignSelf: "stretch",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    gap: spacing.sm,
    padding: spacing.md
  },
  verificationTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" },
  helperText: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  input: { alignSelf: "stretch", backgroundColor: colors.white, borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, color: colors.ink, minHeight: 46, paddingHorizontal: spacing.md },
  successText: { color: colors.success, fontSize: 13, lineHeight: 18 },
  errorText: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  verifyButton: { alignItems: "center", backgroundColor: colors.accent, borderRadius: radii.pill, justifyContent: "center", minHeight: 44, paddingHorizontal: spacing.md },
  verifyButtonText: { color: colors.white, fontSize: 14, fontWeight: "800" },
  tokenLink: { color: colors.ink, fontSize: 13, textAlign: "center" },
  disabled: { opacity: 0.6 },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.surfaceStrong,
    borderRadius: radii.pill,
    height: 84,
    justifyContent: "center",
    width: 84
  },
  name: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900"
  },
  meta: {
    color: colors.muted,
    fontSize: 15
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    justifyContent: "center",
    minHeight: 48,
    width: "100%"
  },
  primaryText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800"
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    width: "100%"
  },
  secondaryText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800"
  }
});
