import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ApiError } from "../../src/api/client";
import { verifyCampusEmail } from "../../src/api/authApi";
import { useAuth } from "../../src/contexts/AuthContext";
import { colors, radii, spacing } from "../../src/theme/theme";

export default function VerifyCampusEmailScreen() {
  const router = useRouter();
  const { token: tokenParam } = useLocalSearchParams<{ token?: string | string[] }>();
  const routeToken = Array.isArray(tokenParam) ? tokenParam[0] ?? "" : tokenParam ?? "";
  const [token, setToken] = useState(routeToken);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const attempted = useRef(false);
  const { isAuthenticated, refreshUser } = useAuth();

  async function submitVerification(value: string) {
    const normalizedToken = value.trim();
    if (!normalizedToken) {
      setError("Open the link in your CPUT inbox or paste its token here.");
      return;
    }

    setError("");
    setMessage("");
    setIsVerifying(true);
    try {
      await verifyCampusEmail(normalizedToken);
      if (isAuthenticated) await refreshUser();
      setMessage("Your CPUT email is verified. Buyers will see the campus-email verified badge on your seller profile.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not reach the API server.");
    } finally {
      setIsVerifying(false);
    }
  }

  useEffect(() => {
    if (!routeToken || attempted.current) return;
    attempted.current = true;
    void submitVerification(routeToken);
  }, [routeToken]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.icon}>
          <Feather name={message ? "shield" : "mail"} size={28} color={message ? colors.success : colors.accent} />
        </View>
        <Text style={styles.title}>Verify your CPUT email</Text>
        <Text style={styles.subtitle}>This confirms access to your CPUT mailbox. Your email address stays private.</Text>
        {isVerifying ? <Text style={styles.helper}>Verifying your email...</Text> : null}
        {message ? <Text accessibilityRole="alert" style={styles.success}>{message}</Text> : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {!message ? (
          <>
            <Text style={styles.label}>Verification token</Text>
            <TextInput autoCapitalize="none" autoCorrect={false} onChangeText={setToken} placeholder="Paste the token from your email link" placeholderTextColor={colors.subtle} style={styles.input} value={token} />
            <Pressable accessibilityRole="button" disabled={isVerifying} onPress={() => void submitVerification(token)} style={[styles.primaryButton, isVerifying && styles.disabled]}>
              <Text style={styles.primaryText}>{isVerifying ? "Verifying..." : "Verify email"}</Text>
            </Pressable>
          </>
        ) : null}
        <Pressable accessibilityRole="button" onPress={() => router.replace(isAuthenticated ? "/(tabs)/profile" : "/(auth)/login")} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>{isAuthenticated ? "Back to profile" : "Go to login"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", padding: spacing.xl },
  icon: { alignItems: "center", alignSelf: "flex-start", backgroundColor: "rgba(241, 90, 36, 0.08)", borderRadius: radii.pill, height: 56, justifyContent: "center", marginBottom: spacing.lg, width: 56 },
  title: { color: colors.ink, fontSize: 27, fontWeight: "900" },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing.sm },
  helper: { color: colors.muted, fontSize: 13, marginTop: spacing.lg },
  success: { color: colors.success, fontSize: 14, lineHeight: 21, marginTop: spacing.lg },
  error: { color: colors.danger, fontSize: 14, lineHeight: 21, marginTop: spacing.lg },
  label: { color: colors.ink, fontSize: 13, fontWeight: "700", marginTop: spacing.xl },
  input: { borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, color: colors.ink, fontSize: 14, minHeight: 50, marginTop: spacing.sm, paddingHorizontal: spacing.md },
  primaryButton: { alignItems: "center", backgroundColor: colors.accent, borderRadius: radii.pill, justifyContent: "center", marginTop: spacing.lg, minHeight: 48 },
  primaryText: { color: colors.white, fontSize: 15, fontWeight: "800" },
  secondaryButton: { alignItems: "center", borderColor: colors.line, borderRadius: radii.pill, borderWidth: 1, justifyContent: "center", marginTop: spacing.md, minHeight: 48 },
  secondaryText: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  disabled: { opacity: 0.6 }
});