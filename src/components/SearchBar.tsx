import { Feather } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";
import { colors, radii } from "../theme/theme";

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
};

export function SearchBar({ value, onChangeText, onSubmit, placeholder = "what are you looking for?" }: Props) {
  return (
    <View style={styles.container}>
      <Feather name="search" size={22} color={colors.subtle} />
      <TextInput
        accessibilityLabel="Search marketplace"
        autoCapitalize="none"
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.subtle}
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.surfaceStrong,
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 14
  },
  input: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    minHeight: 42
  }
});
