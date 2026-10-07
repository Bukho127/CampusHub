import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../../src/api/client";
import { requestSchoolEmailCode } from "../../src/api/authApi";
import { useAuth } from "../../src/contexts/AuthContext";
import { colors, radii, spacing } from "../../src/theme/theme";

function isEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [email, setEmail] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!isEmail(normalizedEmail)) {
      setError("Enter a valid school email address.");
      return;
    }
    if (!token) {
      router.replace("/(auth)/login");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestSchoolEmailCode(normalizedEmail, studentNumber.trim() || undefined, token);
      router.push({ pathname: "/(auth)/enter-code", params: { email: normalizedEmail } });
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
          <Text style={styles.title}>Verify your school email</Text>
          <Text style={styles.subtitle}>We will send a 6-digit code to an active institution email. Your school address stays private.</Text>
          <Text style={styles.label}>School email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="name@school.edu"
            placeholderTextColor={colors.subtle}
            style={styles.input}
            value={email}
          />
          <Text style={styles.label}>Student number <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            autoCapitalize="characters"
            onChangeText={setStudentNumber}
            placeholder="Student number"
            placeholderTextColor={colors.subtle}
            style={styles.input}
            value={studentNumber}
          />
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <Pressable accessibilityRole="button" disabled={isSubmitting} onPress={submit} style={[styles.primaryButton, isSubmitting && styles.disabled]}>
            <Text style={styles.primaryText}>{isSubmitting ? "Sending code..." : "Send verification code"}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Back</Text>
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
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginBottom: spacing.xl, marginTop: spacing.sm },
  label: { color: colors.ink, fontSize: 13, fontWeight: "700", marginBottom: spacing.sm, marginTop: spacing.md },
  optional: { color: colors.muted, fontWeight: "400" },
  input: { borderColor: colors.line, borderRadius: radii.sm, borderWidth: 1, color: colors.ink, fontSize: 15, minHeight: 50, paddingHorizontal: spacing.md },
  error: { color: colors.danger, fontSize: 13, lineHeight: 19, marginTop: spacing.md },
  primaryButton: { alignItems: "center", backgroundColor: colors.accent, borderRadius: radii.pill, justifyContent: "center", marginTop: spacing.xl, minHeight: 50 },
  primaryText: { color: colors.white, fontSize: 15, fontWeight: "800" },
  secondaryButton: { alignItems: "center", borderColor: colors.line, borderRadius: radii.pill, borderWidth: 1, justifyContent: "center", marginTop: spacing.md, minHeight: 48 },
  secondaryText: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  disabled: { opacity: 0.6 }
});
