import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../../src/api/client";
import { resetPassword } from "../../src/api/authApi";
import { colors, radii, spacing } from "../../src/theme/theme";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token: tokenParam } = useLocalSearchParams<{ token?: string | string[] }>();
  const [token, setToken] = useState(Array.isArray(tokenParam) ? tokenParam[0] ?? "" : tokenParam ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    setError("");
    if (!token.trim()) {
      setError("This reset link is missing its token. Request a new one.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token.trim(), password);
      router.replace("/(auth)/login");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not reach the API server.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Choose a new password</Text>
          <Text style={styles.subtitle}>Your reset link expires after 30 minutes and can only be used once.</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Reset token</Text>
            <TextInput autoCapitalize="none" autoCorrect={false} onChangeText={setToken} placeholder="Paste the token from your reset link" placeholderTextColor={colors.subtle} style={styles.input} value={token} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>New password</Text>
            <TextInput autoComplete="new-password" onChangeText={setPassword} placeholder="At least 8 characters" placeholderTextColor={colors.subtle} secureTextEntry style={styles.input} value={password} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Confirm new password</Text>
            <TextInput autoComplete="new-password" onChangeText={setConfirmPassword} placeholder="Re-enter your password" placeholderTextColor={colors.subtle} secureTextEntry style={styles.input} value={confirmPassword} />
          </View>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <Pressable accessibilityRole="button" disabled={isSubmitting} onPress={submit} style={[styles.primaryButton, isSubmitting && styles.disabled]}>
            <Text style={styles.primaryText}>{isSubmitting ? "Updating..." : "Update password"}</Text>
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
  title: { color: colors.ink, fontSize: 28, fontWeight: "900" },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: spacing.xl, marginTop: spacing.sm },
  field: { marginBottom: spacing.md },
  label: { color: colors.ink, fontSize: 13, marginBottom: spacing.sm },
  input: { borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, color: colors.ink, fontSize: 15, minHeight: 50, paddingHorizontal: spacing.md },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18, marginTop: spacing.md },
  primaryButton: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radii.pill, justifyContent: "center", marginTop: spacing.xl, minHeight: 48 },
  disabled: { opacity: 0.62 },
  primaryText: { color: colors.white, fontSize: 15, fontWeight: "700" }
});