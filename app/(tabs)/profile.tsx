import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "../../src/components/Badge";
import { useAuth } from "../../src/contexts/AuthContext";
import { colors, radii, spacing } from "../../src/theme/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, logout, user } = useAuth();

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
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Feather name="user" size={34} color={colors.ink} />
        </View>
        <Text style={styles.name}>{user.displayName}</Text>
        <Text style={styles.meta}>
          {user.identityType} - {user.location ?? "Campus community"}
        </Text>
        <Badge label={`Email ${user.emailVerificationStatus ?? "unverified"}`} tone={user.emailVerificationStatus === "verified" ? "success" : "accent"} />
        <Badge label={`Vendor ${user.vendorVerificationStatus ?? "unverified"}`} tone={user.vendorVerificationStatus === "verified" ? "success" : "light"} />
        <Text style={styles.body}>
          You are signed in through the Community Store API. My Listings, purchases, sales, reviews, and settings can now use this authenticated session.
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
      </View>
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
