import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { colors, radii, spacing } from "../theme/theme";

type ToastTone = "success" | "info" | "danger";

type ToastOptions = {
  title: string;
  message?: string;
  tone?: ToastTone;
};

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneColors: Record<ToastTone, string> = {
  danger: colors.danger,
  info: colors.ink,
  success: colors.success
};

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    Animated.parallel([
      Animated.timing(opacity, { duration: 160, toValue: 0, useNativeDriver: true }),
      Animated.timing(translateY, { duration: 160, toValue: -16, useNativeDriver: true })
    ]).start(() => setToast(null));
  };

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast: (options) => {
        if (timer.current) clearTimeout(timer.current);
        setToast(options);
        opacity.setValue(0);
        translateY.setValue(-16);
        Animated.parallel([
          Animated.timing(opacity, { duration: 180, toValue: 1, useNativeDriver: true }),
          Animated.spring(translateY, { bounciness: 5, speed: 18, toValue: 0, useNativeDriver: true })
        ]).start();
        timer.current = setTimeout(hideToast, 2600);
      }
    }),
    [opacity, translateY]
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const tone = toast?.tone ?? "info";

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <SafeAreaView pointerEvents="box-none" style={styles.toastRoot}>
          <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
            <View style={[styles.toastIcon, { backgroundColor: toneColors[tone] }]}>
              <Feather name={tone === "danger" ? "alert-circle" : "check"} size={17} color={colors.white} />
            </View>
            <View style={styles.toastText}>
              <Text style={styles.toastTitle}>{toast.title}</Text>
              {toast.message ? <Text style={styles.toastMessage}>{toast.message}</Text> : null}
            </View>
            <Pressable accessibilityLabel="Dismiss notification" onPress={hideToast} style={styles.toastClose}>
              <Feather name="x" size={17} color={colors.muted} />
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}

const styles = StyleSheet.create({
  toastRoot: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 100
  },
  toast: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    maxWidth: 460,
    padding: spacing.md,
    shadowColor: colors.ink,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    width: "92%",
    elevation: 8
  },
  toastIcon: {
    alignItems: "center",
    borderRadius: radii.pill,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  toastText: {
    flex: 1,
    gap: 2
  },
  toastTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700"
  },
  toastMessage: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17
  },
  toastClose: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  }
});
