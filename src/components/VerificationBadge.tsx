import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { radii } from "../theme/theme";

type Props = {
  verified: boolean;
  label: string;
};

export function VerificationBadge({ verified, label }: Props) {
  return (
    <View style={[styles.badge, verified ? styles.verified : styles.unverified]}>
      <MaterialCommunityIcons name="check-decagram" size={16} color={verified ? styles.verifiedText.color : styles.unverifiedText.color} />
      <Text style={[styles.text, verified ? styles.verifiedText : styles.unverifiedText]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: "center", alignSelf: "flex-start", borderRadius: radii.pill, flexDirection: "row", gap: 5, paddingHorizontal: 10, paddingVertical: 6 },
  verified: { backgroundColor: "#fff0e8", borderColor: "#f1a17c", borderWidth: 1 },
  unverified: { backgroundColor: "#f0f0f0", borderColor: "#d4d4d4", borderWidth: 1 },
  text: { fontSize: 12, fontWeight: "800" },
  verifiedText: { color: "#c44818" },
  unverifiedText: { color: "#777777" }
});
