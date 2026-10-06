import { Image, StyleSheet, Text, View } from "react-native";
import { assetLabels, assetSlots, type AssetSlot } from "../theme/assets";
import { colors, radii } from "../theme/theme";

type Props = {
  slot: AssetSlot;
  uri?: string;
  height?: number;
  rounded?: number;
};

export function AssetSlotView({ slot, uri, height = 132, rounded = radii.md }: Props) {
  if (uri) {
    return <Image source={{ uri }} style={[styles.image, { height, borderRadius: rounded }]} resizeMode="cover" />;
  }

  const source = assetSlots[slot];

  if (source) {
    return <Image source={source} style={[styles.image, { height, borderRadius: rounded }]} resizeMode="cover" />;
  }

  return (
    <View style={[styles.placeholder, { height, borderRadius: rounded }]}>
      <Text style={styles.placeholderText}>{assetLabels[slot]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%"
  },
  placeholder: {
    alignItems: "center",
    backgroundColor: colors.surfaceStrong,
    justifyContent: "center",
    overflow: "hidden",
    width: "100%"
  },
  placeholderText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700"
  }
});
