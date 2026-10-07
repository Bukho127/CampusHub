import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../../src/api/client";
import { confirmSchoolEmailCode, requestSchoolEmailCode } from "../../src/api/authApi";
import { useAuth } from "../../src/contexts/AuthContext";
import { colors, radii, spacing } from "../../src/theme/theme";

export default function EnterCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = Array.isArray(params.email) ? params.email[0] ?? "" : params.email ?? "";
  const { refreshUser, token } = useAuth();
  const [code, setCode] = useState("");
  const [secondsUntilResend, setSecondsUntilResend] = useState(60);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (secondsUntilResend <= 0) return;
    const timer = setTimeout(() => setSecondsUntilResend((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsUntilResend]);

  async function submitCode() {
    setError("");
    setMessage("");
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (!token) {
      router.replace("/(auth)/login");
      return;
    }

    setIsConfirming(true);
    try {
      await confirmSchoolEmailCode(code, token);
      await refreshUser();
      setMessage("School email verified. You can now create listings.");
      router.replace("/(tabs)/profile");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not reach the API server.");
    } finally {
      setIsConfirming(false);
    }
  }

  async function resendCode() {
    setError("");
    setMessage("");
    if (!token || !email) {
      setError("Return to verification and enter your school email again.");
      return;
    }

    setIsResending(true);
    try {
      await requestSchoolEmailCode(email, undefined, token);
      setSecondsUntilResend(60);
      setCode("");
      setMessage("If that email belongs to an active institution, a new code has been sent.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not reach the API server.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Enter code</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code sent to {email || "your school email"}. The code expires in 10 minutes.</Text>
          <Text style={styles.label}>Verification code</Text>
          <TextInput
            accessibilityLabel="6-digit verification code"
            autoCapitalize="none"
            autoComplete="one-time-code"
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            placeholderTextColor={colors.subtle}
            style={styles.codeInput}
            value={code}
          />
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          {message ? <Text accessibilityRole="alert" style={styles.success}>{message}</Text> : null}
          <Pressable accessibilityRole="button" disabled={isConfirming} onPress={submitCode} style={[styles.primaryButton, isConfirming && styles.disabled]}>
            <Text style={styles.primaryText}>{isConfirming ? "Verifying..." : "Verify email"}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={secondsUntilResend > 0 || isResending} onPress={resendCode} style={[styles.resendButton, (secondsUntilResend > 0 || isResending) && styles.disabled]}>
            <Text style={styles.resendText}>{isResending ? "Sending..." : secondsUntilResend > 0 ? `Resend code in ${secondsUntilResend}s` : "Resend code"}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>Change school email</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  keyboard: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", padding: spacing.xl },
  title: { color: colors.ink, fontSize: 27, fontWeight: "900" },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.sm },
  label: { color: colors.ink, fontSize: 13, fontWeight: "700", marginTop: spacing.xl },
  codeInput: { borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, color: colors.ink, fontSize: 25, fontWeight: "800", letterSpacing: 6, minHeight: 58, marginTop: spacing.sm, paddingHorizontal: spacing.md, textAlign: "center" },
  error: { color: colors.danger, fontSize: 13, lineHeight: 19, marginTop: spacing.md },
  success: { color: colors.success, fontSize: 13, lineHeight: 19, marginTop: spacing.md },
  primaryButton: { alignItems: "center", backgroundColor: colors.accent, borderRadius: radii.pill, justifyContent: "center", marginTop: spacing.xl, minHeight: 50 },
  primaryText: { color: colors.white, fontSize: 15, fontWeight: "800" },
  resendButton: { alignItems: "center", justifyContent: "center", marginTop: spacing.md, minHeight: 44 },
  resendText: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  backButton: { alignItems: "center", justifyContent: "center", marginTop: spacing.sm, minHeight: 44 },
  backText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  disabled: { opacity: 0.55 }
});
