import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../theme/theme";

type Props = {
  label: string;
  tone?: "dark" | "light" | "success" | "accent";
};

export function Badge({ label, tone = "light" }: Props) {
  return (
    <View style={[styles.badge, styles[tone]]}>
      <Text style={[styles.text, tone === "dark" && styles.darkText]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  text: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "700"
  },
  darkText: {
    color: colors.white
  },
  dark: {
    backgroundColor: colors.primary
  },
  light: {
    backgroundColor: colors.surfaceStrong
  },
  success: {
    backgroundColor: "#dff4e8"
  },
  accent: {
    backgroundColor: "#ffe7db"
  }
});
