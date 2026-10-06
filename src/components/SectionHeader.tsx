import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/theme";

type Props = {
  title: string;
  action?: string;
};

export function SectionHeader({ title, action }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action ? <Text style={styles.action}>{action}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  title: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800"
  },
  action: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700"
  }
});
