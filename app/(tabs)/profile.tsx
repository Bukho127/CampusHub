import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "../../src/components/Badge";
import { colors, radii, spacing } from "../../src/theme/theme";

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Feather name="user" size={34} color={colors.ink} />
        </View>
        <Text style={styles.name}>Khanya Jakavu</Text>
        <Text style={styles.meta}>Student - District Six Campus</Text>
        <Badge label="Verification pending in demo" tone="accent" />
        <Text style={styles.body}>
          Demo authentication, My Listings, purchases, sales, reviews, notification preferences, and logout are reserved for Phase 2.
        </Text>
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
  }
});
