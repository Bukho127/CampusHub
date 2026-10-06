import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "../../src/components/Badge";
import { colors, spacing } from "../../src/theme/theme";

export default function SellScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Feather name="plus-circle" size={34} color={colors.accent} />
        <Text style={styles.title}>Sell is planned for Phase 2</Text>
        <Text style={styles.body}>
          Listing creation, image picker, drafts, edit flow, and ownership checks are intentionally not faked in Phase 1.
        </Text>
        <Badge label="Demo only" tone="accent" />
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
    gap: spacing.md,
    padding: spacing.xl
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "900"
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22
  }
});
