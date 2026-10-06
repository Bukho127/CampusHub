import { Feather } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../../src/api/client";
import type { BackendIdentityType } from "../../src/api/types";
import { useAuth } from "../../src/contexts/AuthContext";
import { colors, radii, spacing } from "../../src/theme/theme";

const identityTypes: BackendIdentityType[] = ["student", "faculty", "resident", "vendor"];

function isEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value);
}

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [identityType, setIdentityType] = useState<BackendIdentityType>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("Enter your first and last name.");
      return;
    }

    if (!isEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ firstName: firstName.trim(), lastName: lastName.trim(), email, password, identityType });
      router.replace("/(tabs)");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not register. Check that the API server is running.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Create an account</Text>
          <Text style={styles.subtitle}>Join your campus community. Buy, sell, and connect with students, faculty, and local vendors all in one trusted place.</Text>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>First Name</Text>
              <TextInput placeholder="First name" placeholderTextColor={colors.subtle} style={styles.input} value={firstName} onChangeText={setFirstName} />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput placeholder="Last name" placeholderTextColor={colors.subtle} style={styles.input} value={lastName} onChangeText={setLastName} />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput autoCapitalize="none" keyboardType="email-address" placeholder="Enter your email" placeholderTextColor={colors.subtle} style={styles.input} value={email} onChangeText={setEmail} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordBox}>
              <TextInput placeholder="must be 8 characters" placeholderTextColor={colors.subtle} secureTextEntry={!showPassword} style={styles.passwordInput} value={password} onChangeText={setPassword} />
              <Pressable accessibilityLabel="Toggle password visibility" onPress={() => setShowPassword((value) => !value)} style={styles.eyeButton}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput placeholder="Repeat password" placeholderTextColor={colors.subtle} secureTextEntry={!showPassword} style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} />
          </View>

          <Text style={styles.label}>Community identity</Text>
          <View style={styles.identityGrid}>
            {identityTypes.map((item) => (
              <Pressable key={item} onPress={() => setIdentityType(item)} style={[styles.identityChip, identityType === item && styles.identityChipActive]}>
                <Text style={[styles.identityText, identityType === item && styles.identityTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable accessibilityRole="button" disabled={isSubmitting} onPress={submit} style={[styles.primaryButton, isSubmitting && styles.disabled]}>
            <Text style={styles.primaryText}>{isSubmitting ? "Registering..." : "Register"}</Text>
          </Pressable>

          <Text style={styles.switchText}>
            Already Have an account ?{" "}
            <Link href="/(auth)/login" style={styles.switchLink}>
              Login
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
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: 68
  },
  title: {
    color: colors.ink,
    fontSize: 29,
    fontWeight: "900",
    textAlign: "center"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 28,
    marginTop: 14,
    textAlign: "center"
  },
  row: {
    flexDirection: "row",
    gap: 12
  },
  halfField: {
    flex: 1,
    marginBottom: 18
  },
  field: {
    marginBottom: 18
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
  identityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12
  },
  identityChip: {
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  identityChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  identityText: {
    color: colors.ink,
    fontSize: 13,
    textTransform: "capitalize"
  },
  identityTextActive: {
    color: colors.white,
    fontWeight: "800"
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    textAlign: "center"
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    justifyContent: "center",
    marginTop: 20,
    minHeight: 48
  },
  disabled: {
    opacity: 0.62
  },
  primaryText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700"
  },
  switchText: {
    color: colors.ink,
    fontSize: 14,
    marginTop: 26,
    textAlign: "center"
  },
  switchLink: {
    color: colors.accent,
    fontWeight: "900"
  }
});
