import { Feather } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";
import { toAbsoluteApiUrl } from "../api/config";
import { colors, radii } from "../theme/theme";

type ProfileAvatarProps = {
  uri?: string | null;
  size?: number;
  iconSize?: number;
  initials?: string;
};

export function ProfileAvatar({ uri, size = 84, iconSize = 34, initials }: ProfileAvatarProps) {
  const sourceUri = uri ? toAbsoluteApiUrl(uri) : undefined;
  const backgroundColor = sourceUri || initials ? colors.accent : colors.surfaceStrong;

  return (
    <View style={[styles.avatar, { backgroundColor, borderRadius: size / 2, height: size, width: size }]}>
      {sourceUri ? (
        <Image source={{ uri: sourceUri }} style={[styles.image, { borderRadius: size / 2 }]} resizeMode="cover" />
      ) : initials ? (
        <Text style={[styles.initials, { fontSize: Math.max(18, size * 0.32) }]}>{initials}</Text>
      ) : (
        <Feather name="user" size={iconSize} color={colors.ink} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  image: {
    height: "100%",
    width: "100%"
  },
  initials: {
    color: colors.white,
    fontWeight: "900"
  }
});
