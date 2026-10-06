import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../../src/api/client";
import { requestCampusEmailVerification, uploadProfileAvatar } from "../../src/api/authApi";
import { ProfileAvatar } from "../../src/components/ProfileAvatar";
import { useAuth } from "../../src/contexts/AuthContext";
import { colors, radii, spacing } from "../../src/theme/theme";

const profileBanner = require("../../assets/hero-market.png");
type FeatherName = ComponentProps<typeof Feather>["name"];

function initialsFor(name?: string) {
  return (name ?? "Campus Hub")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function MenuCard({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function MenuRow({ icon, label, onPress, value }: { icon: FeatherName; label: string; onPress?: () => void; value?: string }) {
  const content = (
    <>
      <View style={styles.rowIcon}>
        <Feather name={icon} size={19} color={colors.ink} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      <Feather name="chevron-right" size={22} color={colors.ink} />
    </>
  );

  if (!onPress) {
    return <View style={styles.menuRow}>{content}</View>;
  }

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.menuRow}>
      {content}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, logout, refreshUser, token, user } = useAuth();
  const [campusEmail, setCampusEmail] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  async function requestCampusVerification() {
    setVerificationMessage("");
    setVerificationError("");
    if (!campusEmail.trim().toLowerCase().endsWith("@mycput.ac.za")) {
      setVerificationError("Use your CPUT email address ending in @mycput.ac.za.");
      return;
    }
    if (!token) return;

    setIsSendingVerification(true);
    try {
      await requestCampusEmailVerification(campusEmail.trim().toLowerCase(), token);
      await refreshUser();
      setVerificationMessage("Verification link sent.");
    } catch (caught) {
      setVerificationError(caught instanceof ApiError ? caught.message : "Could not reach the API server.");
    } finally {
      setIsSendingVerification(false);
    }
  }

  async function chooseAvatar() {
    setAvatarMessage("");
    setAvatarError("");
    if (!token) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setAvatarError("Allow photo library access to choose a profile photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85
    });

    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;

    setIsUploadingAvatar(true);
    try {
      await uploadProfileAvatar(
        {
          uri: asset.uri,
          name: asset.fileName ?? "profile-avatar.jpg",
          type: asset.mimeType ?? "image/jpeg"
        },
        token
      );
      await refreshUser();
      setAvatarMessage("Profile photo updated.");
    } catch (caught) {
      setAvatarError(caught instanceof ApiError ? caught.message : "Could not upload your profile photo.");
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.signedOut}>
          <ProfileAvatar initials="CH" size={104} iconSize={38} />
          <Text style={styles.name}>Profile</Text>
          <Text style={styles.meta}>CampusHub account</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push("/(auth)/login")} style={styles.primaryButton}>
            <Text style={styles.primaryText}>Login</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push("/(auth)/register")} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Create account</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const userId = user.id ?? user._id;

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <Image source={profileBanner} style={styles.bannerImage} resizeMode="cover" />
          <View style={styles.profileInfo}>
            <View style={styles.avatarWrap}>
              <ProfileAvatar uri={user.avatar} initials={initialsFor(user.displayName)} size={108} iconSize={42} />
              <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" disabled={isUploadingAvatar} onPress={chooseAvatar} style={styles.avatarEditButton}>
                <Feather name="camera" size={16} color={colors.white} />
              </Pressable>
            </View>
            <Text style={styles.name}>Hello, {user.displayName}</Text>
            <Text style={styles.meta}>
              {user.identityType} - {user.location ?? "Campus community"}
            </Text>
            <Pressable accessibilityRole="button" disabled={isUploadingAvatar} onPress={chooseAvatar} style={[styles.editProfileButton, isUploadingAvatar && styles.disabled]}>
              <Text style={styles.editProfileText}>{isUploadingAvatar ? "Uploading..." : "Edit Profile"}</Text>
            </Pressable>
            {avatarMessage ? <Text accessibilityRole="alert" style={styles.successText}>{avatarMessage}</Text> : null}
            {avatarError ? <Text accessibilityRole="alert" style={styles.errorText}>{avatarError}</Text> : null}
          </View>
        </View>

        <MenuCard title="Payment Info">
          <MenuRow icon="gift" label="Loyalty Points" value="0" />
          <MenuRow icon="credit-card" label="Payment Method" />
        </MenuCard>

        <MenuCard title="Settings">
          <MenuRow icon="mail" label="Email" value={user.emailVerificationStatus ?? "unverified"} />
          <MenuRow icon="shield" label="Campus Email" value={user.campusEmailVerificationStatus ?? "unverified"} />
          <MenuRow icon="globe" label="Language" />
          <MenuRow icon="headphones" label="Support" />
        </MenuCard>

        {user.campusEmailVerificationStatus !== "verified" ? (
          <MenuCard title="Campus Verification">
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setCampusEmail}
              placeholder="Your CPUT email address"
              placeholderTextColor={colors.subtle}
              style={styles.input}
              value={campusEmail}
            />
            {verificationMessage ? <Text accessibilityRole="alert" style={styles.successText}>{verificationMessage}</Text> : null}
            {verificationError ? <Text accessibilityRole="alert" style={styles.errorText}>{verificationError}</Text> : null}
            <Pressable accessibilityRole="button" disabled={isSendingVerification} onPress={requestCampusVerification} style={[styles.verifyButton, isSendingVerification && styles.disabled]}>
              <Text style={styles.verifyButtonText}>{isSendingVerification ? "Sending..." : user.campusEmailVerificationStatus === "pending" ? "Resend verification link" : "Verify campus email"}</Text>
            </Pressable>
            {verificationMessage ? (
              <Pressable accessibilityRole="button" onPress={() => router.push("/(auth)/verify-campus-email")} style={styles.textButton}>
                <Text style={styles.textButtonLabel}>I have a verification token</Text>
              </Pressable>
            ) : null}
          </MenuCard>
        ) : null}

        <MenuCard title="Manage Listing">
          <MenuRow icon="package" label="List your items" onPress={() => router.push("/(tabs)/sell")} />
          {userId ? <MenuRow icon="user-check" label="View seller profile" onPress={() => router.push(`/seller/${userId}`)} /> : null}
          <MenuRow
            icon="log-out"
            label="Logout"
            onPress={() => {
              logout();
              router.replace("/(auth)/login");
            }}
          />
        </MenuCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.white,
    flex: 1
  },
  content: {
    backgroundColor: colors.background,
    paddingBottom: spacing.xl
  },
  signedOut: {
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.xl
  },
  profileHeader: {
    backgroundColor: colors.white,
    paddingBottom: spacing.lg
  },
  bannerImage: {
    height: 222,
    width: "100%"
  },
  profileInfo: {
    alignItems: "center",
    paddingHorizontal: spacing.lg
  },
  avatarWrap: {
    alignItems: "center",
    borderColor: colors.white,
    borderRadius: radii.pill,
    borderWidth: 4,
    marginTop: -56,
    position: "relative"
  },
  avatarEditButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.white,
    borderRadius: radii.pill,
    borderWidth: 2,
    bottom: 2,
    height: 34,
    justifyContent: "center",
    position: "absolute",
    right: 2,
    width: 34
  },
  name: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900",
    marginTop: spacing.sm,
    textAlign: "center"
  },
  meta: {
    color: colors.ink,
    fontSize: 15,
    marginTop: spacing.xs,
    textAlign: "center"
  },
  editProfileButton: {
    alignItems: "center",
    borderColor: colors.success,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: spacing.md,
    minHeight: 40,
    paddingHorizontal: spacing.md
  },
  editProfileText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: "700"
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "500",
    marginBottom: spacing.xs
  },
  menuRow: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 32
  },
  rowIcon: {
    alignItems: "center",
    height: 28,
    justifyContent: "center",
    marginRight: spacing.sm,
    width: 28
  },
  rowLabel: {
    color: colors.ink,
    flex: 1,
    fontSize: 15
  },
  rowValue: {
    color: colors.muted,
    fontSize: 12,
    marginRight: spacing.xs,
    textTransform: "capitalize"
  },
  input: {
    alignSelf: "stretch",
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.ink,
    minHeight: 46,
    paddingHorizontal: spacing.md
  },
  verifyButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  verifyButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800"
  },
  textButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34
  },
  textButtonLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700"
  },
  successText: {
    color: colors.success,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center"
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center"
  },
  disabled: {
    opacity: 0.6
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    justifyContent: "center",
    minHeight: 48,
    width: "100%"
  },
  primaryText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800"
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    width: "100%"
  },
  secondaryText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800"
  }
});
