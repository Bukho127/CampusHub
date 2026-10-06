import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { Animated, Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useFavorites } from "../contexts/FavoritesContext";
import { colors, radii } from "../theme/theme";

type Props = {
  listingId: string;
  size?: number;
  unselectedColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function FavoriteButton({ listingId, size = 18, unselectedColor = colors.ink, style }: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const scale = useRef(new Animated.Value(1)).current;
  const favorite = isFavorite(listingId);

  function handlePress() {
    toggleFavorite(listingId);
    scale.stopAnimation();
    scale.setValue(0.92);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.12, duration: 90, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 110, useNativeDriver: true })
    ]).start();
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={favorite ? "Remove from favorites" : "Add to favorites"}
      accessibilityState={{ selected: favorite }}
      onPress={(event) => {
        event.stopPropagation();
        handlePress();
      }}
      style={[styles.button, style]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={favorite ? "heart" : "heart-outline"}
          size={size}
          color={favorite ? colors.accent : unselectedColor}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44
  }
});
