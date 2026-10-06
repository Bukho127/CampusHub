import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { DietaryTag } from "../models/marketplace";
import { radii } from "../theme/theme";

const labels: Record<DietaryTag, string> = {
  healthy: "Healthy",
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  halal: "Halal"
};

type Props = {
  tag: DietaryTag;
};

export function DietaryTagBadge({ tag }: Props) {
  const icon: ComponentProps<typeof Feather>["name"] = tag === "healthy" ? "heart" : tag === "halal" ? "check-circle" : "feather";

  return (
    <View style={styles.badge}>
      <Feather name={icon} size={12} color="#176b3a" />
      <Text style={styles.text}>{labels[tag]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    backgroundColor: "#e7f5ec",
    borderColor: "#b9dfc6",
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  text: {
    color: "#176b3a",
    fontSize: 11,
    fontWeight: "800"
  }
});
