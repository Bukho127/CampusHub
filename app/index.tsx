import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, useWindowDimensions, View, type ImageSourcePropType, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../src/contexts/AuthContext";
import { assetSlots } from "../src/theme/assets";
import { colors, radii, spacing } from "../src/theme/theme";

const slides: Array<{
  id: string;
  image: ImageSourcePropType | null;
  kicker: string[];
  title: string[];
  subtitle: string;
}> = [
  {
    id: "community",
    image: assetSlots.logo,
    kicker: ["Where", "Meets"],
    title: ["Campus", "Community."],
    subtitle: "Marketplace built to connect students, faculty, local vendors, and residents"
  },
  {
    id: "delivery",
    image: require("../assets/slideshow-one.png") as ImageSourcePropType,
    kicker: ["Trade", "With"],
    title: ["Trust", "On Campus."],
    subtitle: "Find books, essentials, and local deals, then coordinate handovers and delivery with people nearby."
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { isAuthenticated, isHydrating } = useAuth();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<(typeof slides)[number]>>(null);

  useEffect(() => {
    if (!isHydrating && isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isHydrating, router]);

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(nextIndex);
  }

  if (isHydrating || isAuthenticated) {
    return <SafeAreaView style={styles.safe} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <FlatList
          ref={listRef}
          style={styles.slider}
          contentContainerStyle={styles.sliderContent}
          data={slides}
          horizontal
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={handleScrollEnd}
          pagingEnabled
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <View style={styles.logoWrap}>
                {item.image ? <Image source={item.image} style={item.id === "delivery" ? styles.slideImage : styles.logo} resizeMode="contain" /> : null}
              </View>

              <View style={styles.copy}>
                <Text style={styles.kicker}>{item.kicker[0]}</Text>
                <Text style={styles.title}>{item.title[0]}</Text>
                <Text style={styles.kicker}>{item.kicker[1]}</Text>
                <Text style={styles.title}>{item.title[1]}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </View>
            </View>
          )}
          showsHorizontalScrollIndicator={false}
        />

        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <Pressable
              key={slide.id}
              accessibilityLabel={`Show onboarding slide ${index + 1}`}
              onPress={() => {
                setActiveIndex(index);
                listRef.current?.scrollToIndex({ animated: true, index });
              }}
              style={[styles.dot, activeIndex === index && styles.activeDot]}
            />
          ))}
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
  content: {
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl
  },
  slide: {
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: spacing.xl
  },
  slider: {
    alignSelf: "stretch",
    flexGrow: 0,
    height: 520,
    marginHorizontal: -spacing.xl
  },
  sliderContent: {
    alignItems: "stretch"
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 68,
    minHeight: 224
  },
  logo: {
    height: 152,
    width: 152
  },
  slideImage: {
    height: 224,
    width: 260
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
    maxWidth: 360,
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
