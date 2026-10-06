import { Feather } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../../src/api/client";
import { useAuth } from "../../src/contexts/AuthContext";
import { assetSlots } from "../../src/theme/assets";
import { colors, radii, spacing } from "../../src/theme/theme";

function isEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value);
}

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    setError("");

    if (!isEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
      router.replace("/(tabs)");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not sign in. Check that the API server is running.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {assetSlots.logo ? <Image source={assetSlots.logo} style={styles.logo} resizeMode="contain" /> : null}
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Please login to your account</Text>

          <View style={styles.field}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={colors.subtle}
              style={styles.input}
              value={email}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordBox}>
              <TextInput
                onChangeText={setPassword}
                placeholder="must be 8 characters"
                placeholderTextColor={colors.subtle}
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
                value={password}
              />
              <Pressable accessibilityLabel="Toggle password visibility" onPress={() => setShowPassword((value) => !value)} style={styles.eyeButton}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          <Text style={styles.forgot}>Forgot Password</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable accessibilityRole="button" disabled={isSubmitting} onPress={submit} style={[styles.primaryButton, isSubmitting && styles.disabled]}>
            <Text style={styles.primaryText}>{isSubmitting ? "Logging in..." : "Login"}</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.or}>Or</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialButton}>
            <Text style={styles.socialText}>Continue With Google</Text>
          </View>
          <View style={styles.socialButton}>
            <Text style={styles.socialText}>Continue With Apple</Text>
          </View>

          <Text style={styles.switchText}>
            Don&apos;t Have an Account ?{" "}
            <Link href="/(auth)/register" style={styles.switchLink}>
              Register
            </Link>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1
  },
  keyboard: {
    flex: 1
  },
  content: {
    alignItems: "center",
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: 74
  },
  logo: {
    height: 70,
    marginBottom: 34,
    width: 70
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: 34,
    marginTop: 12
  },
  field: {
    marginBottom: 20,
    width: "100%"
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    marginBottom: 8
  },
  input: {
    borderColor: colors.line,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: spacing.md
  },
  passwordBox: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 50
  },
  passwordInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    paddingHorizontal: spacing.md
  },
  eyeButton: {
    alignItems: "center",
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center"
  },
  forgot: {
    alignSelf: "flex-end",
    color: colors.ink,
    fontSize: 13,
    marginTop: -12
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 18,
    textAlign: "center"
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    justifyContent: "center",
    marginTop: 32,
    minHeight: 48,
    width: "100%"
  },
  disabled: {
    opacity: 0.62
  },
  primaryText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700"
  },
  dividerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginVertical: 26,
    width: "100%"
  },
  divider: {
    backgroundColor: colors.line,
    flex: 1,
    height: 1
  },
  or: {
    color: colors.ink,
    fontSize: 14
  },
  socialButton: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: "center",
    marginBottom: 14,
    minHeight: 48,
    width: "100%"
  },
  socialText: {
    color: colors.ink,
    fontSize: 15
  },
  switchText: {
    color: colors.ink,
    fontSize: 14,
    marginTop: 18
  },
  switchLink: {
    color: colors.accent,
    fontWeight: "900"
  }
});
