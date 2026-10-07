import { Link } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../../src/api/client";
import { requestPasswordReset } from "../../src/api/authApi";
import { colors, radii, spacing } from "../../src/theme/theme";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    setMessage("");
    setError("");
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setMessage("If an account exists for that email, reset instructions have been sent.");
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
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>Enter the email address linked to your account.</Text>
          <View style={styles.field}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={colors.subtle}
              style={styles.input}
              value={email}
            />
          </View>
          {message ? <Text accessibilityRole="alert" style={styles.success}>{message}</Text> : null}
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <Pressable accessibilityRole="button" disabled={isSubmitting} onPress={submit} style={[styles.primaryButton, isSubmitting && styles.disabled]}>
            <Text style={styles.primaryText}>{isSubmitting ? "Sending..." : "Send reset link"}</Text>
          </Pressable>
          <Link href="/(auth)/login" style={styles.backLink}>Back to login</Link>
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
  success: { color: colors.success, fontSize: 13, lineHeight: 18, marginTop: spacing.md },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18, marginTop: spacing.md },
  primaryButton: { alignItems: "center", backgroundColor: colors.primary, borderRadius: radii.pill, justifyContent: "center", marginTop: spacing.xl, minHeight: 48 },
  disabled: { opacity: 0.62 },
  primaryText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  backLink: { alignSelf: "center", color: colors.ink, fontSize: 14, marginTop: spacing.xl }
});