import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { assetSlots } from "../src/theme/assets";
import { colors, radii, spacing } from "../src/theme/theme";

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.backgroundBeam} />
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          {assetSlots.logo ? <Image source={assetSlots.logo} style={styles.logo} resizeMode="contain" /> : null}
        </View>

        <View style={styles.copy}>
          <Text style={styles.kicker}>Where</Text>
          <Text style={styles.title}>Campus</Text>
          <Text style={styles.kicker}>Meets</Text>
          <Text style={styles.title}>Community.</Text>
          <Text style={styles.subtitle}>Marketplace built to connect students, faculty, local vendors, and residents</Text>
        </View>

        <View style={styles.dots}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push("/(auth)/login")} style={styles.button}>
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>

        <Text style={styles.terms}>
          By continuing you are agreeing with Community Store's Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1
  },
  backgroundBeam: {
    alignSelf: "center",
    backgroundColor: "#eaf9e8",
    height: 560,
    opacity: 0.72,
    position: "absolute",
    top: -40,
    transform: [{ rotate: "18deg" }],
    width: 220
  },
  content: {
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 68
  },
  logo: {
    height: 152,
    width: 152
  },
  copy: {
    alignItems: "center",
    marginBottom: 28
  },
  kicker: {
    color: colors.muted,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 30
  },
  title: {
    color: colors.ink,
    fontSize: 29,
    fontWeight: "900",
    lineHeight: 31
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 20,
    marginTop: 28,
    maxWidth: 310,
    textAlign: "center"
  },
  dots: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 28
  },
  dot: {
    backgroundColor: "#c8c8c8",
    borderRadius: radii.pill,
    height: 10,
    width: 10
  },
  activeDot: {
    backgroundColor: colors.accent,
    width: 28
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    minHeight: 48,
    justifyContent: "center",
    marginBottom: 14,
    width: "100%"
  },
  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700"
  },
  terms: {
    color: colors.subtle,
    fontSize: 11,
    lineHeight: 16,
    maxWidth: 310,
    textAlign: "center"
  }
});
