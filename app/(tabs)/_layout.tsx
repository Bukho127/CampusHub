import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "../../src/theme/theme";

const iconMap = {
  index: "home",
  explore: "search",
  sell: "plus-circle",
  community: "message-square",
  profile: "user"
} as const;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
          height: 78,
          paddingBottom: 12,
          paddingTop: 8
        },
        tabBarLabelStyle: {
          fontSize: 11
        },
        tabBarIcon: ({ color, size, focused }) => {
          const name = iconMap[route.name as keyof typeof iconMap] ?? "circle";
          return <Feather name={name} size={route.name === "sell" ? size + 4 : size} color={focused && route.name === "sell" ? colors.accent : color} />;
        }
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      <Tabs.Screen name="sell" options={{ title: "Sell" }} />
      <Tabs.Screen name="community" options={{ title: "Community" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
