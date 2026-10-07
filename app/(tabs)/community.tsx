import { Feather, FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, FlatList, Image, Modal, PanResponder, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../../src/api/client";
import { Badge } from "../../src/components/Badge";
import { useAuth } from "../../src/contexts/AuthContext";
import type { CommunityPost } from "../../src/models/marketplace";
import { addCommunityPostComment, createCommunityPost, getCommunityPosts, toggleCommunityPostLike } from "../../src/services/communityService";
import { colors, radii, spacing } from "../../src/theme/theme";

type SelectedImage = {
  uri: string;
  name: string;
  type: string;
};

const emptyEvent = {
  title: "",
  summary: "",
  body: "",
  dateLabel: ""
};

function CommunityEmptyState({ onCreate }: { onCreate: () => void }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { duration: 1500, easing: Easing.out(Easing.quad), toValue: 1, useNativeDriver: true }),
        Animated.timing(pulse, { duration: 0, toValue: 0, useNativeDriver: true })
      ])
    );
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { duration: 1200, easing: Easing.inOut(Easing.quad), toValue: 1, useNativeDriver: true }),
        Animated.timing(float, { duration: 1200, easing: Easing.inOut(Easing.quad), toValue: 0, useNativeDriver: true })
      ])
    );

    pulseLoop.start();
    floatLoop.start();
    return () => {
      pulseLoop.stop();
      floatLoop.stop();
    };
  }, [float, pulse]);

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.22] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0] });
  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyArt}>
        <Animated.View style={[styles.emptyPulse, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
        <Animated.View style={[styles.emptyCard, { transform: [{ translateY: floatY }] }]}>
          <View style={styles.emptyCardImage}>
            <Feather name="calendar" size={24} color={colors.accent} />
          </View>
          <View style={styles.emptyCardLineLarge} />
          <View style={styles.emptyCardLineSmall} />
          <View style={styles.emptyCardStats}>
            <View style={styles.emptyStat}>
              <FontAwesome name="heart" size={12} color={colors.accent} />
              <Text style={styles.emptyStatText}>0</Text>
            </View>
            <View style={styles.emptyStat}>
              <Feather name="message-circle" size={13} color={colors.muted} />
              <Text style={styles.emptyStatText}>0</Text>
            </View>
          </View>
        </Animated.View>
      </View>
      <Text style={styles.emptyTitle}>No events yet</Text>
      <Text style={styles.emptyCopy}>Create the first campus post and let the community vote it into the featured spot.</Text>
      <Pressable accessibilityRole="button" onPress={onCreate} style={styles.emptyButton}>
        <Feather name="plus" size={17} color={colors.white} />
        <Text style={styles.emptyButtonText}>Start a post</Text>
      </Pressable>
    </View>
  );
}

export default function CommunityScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<CommunityPost | null>(null);
  const [eventDraft, setEventDraft] = useState(emptyEvent);
  const [eventImage, setEventImage] = useState<SelectedImage | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const sheetY = useRef(new Animated.Value(520)).current;
  const mostLiked = useMemo(() => {
    if (featuredPost) return featuredPost;
    return [...communityPosts].sort((a, b) => b.likeCount - a.likeCount)[0] ?? null;
  }, [communityPosts, featuredPost]);
  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) => gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_event, gesture) => {
          if (gesture.dy > 0) sheetY.setValue(gesture.dy);
        },
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dy > 120 || gesture.vy > 0.85) {
            closeComposer();
            return;
          }

          Animated.spring(sheetY, {
            friction: 7,
            tension: 120,
            toValue: 0,
            useNativeDriver: true
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(sheetY, {
            friction: 7,
            tension: 120,
            toValue: 0,
            useNativeDriver: true
          }).start();
        }
      }),
    [sheetY]
  );

  async function load() {
    try {
      const result = await getCommunityPosts(token);
      setCommunityPosts(result.posts);
      setFeaturedPost(result.featuredPost);
    } catch {
      setError("Could not load community posts.");
    }
  }

  useEffect(() => {
    void load();
  }, [token]);

  function replacePost(updated: CommunityPost) {
    setCommunityPosts((current) => current.map((post) => (post.id === updated.id ? updated : post)));
    setFeaturedPost((current) => (current?.id === updated.id ? updated : current));
  }

  function openComposer() {
    setError("");
    setMessage("");
    if (!token) {
      router.push("/(auth)/login");
      return;
    }
    setComposerOpen(true);
    sheetY.setValue(520);
    requestAnimationFrame(() => {
      Animated.timing(sheetY, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true
      }).start();
    });
  }

  function closeComposer() {
    Animated.timing(sheetY, {
      duration: 220,
      easing: Easing.in(Easing.cubic),
      toValue: 520,
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished) setComposerOpen(false);
    });
  }

  async function chooseEventImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Allow photo library access to add an event image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [16, 10],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85
    });

    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;

    setEventImage({
      uri: asset.uri,
      name: asset.fileName ?? "community-event.jpg",
      type: asset.mimeType ?? "image/jpeg"
    });
  }

  async function submitEvent() {
    setError("");
    setMessage("");
    if (!token) {
      router.push("/(auth)/login");
      return;
    }
    if (!eventDraft.title.trim() || !eventDraft.summary.trim() || !eventDraft.body.trim() || !eventDraft.dateLabel.trim()) {
      setError("Add a title, short summary, event details, and date.");
      return;
    }

    setIsPosting(true);
    try {
      const created = await createCommunityPost(
        {
          title: eventDraft.title.trim(),
          summary: eventDraft.summary.trim(),
          body: eventDraft.body.trim(),
          dateLabel: eventDraft.dateLabel.trim(),
          type: "event",
          ...(eventImage ? { image: eventImage } : {})
        },
        token
      );
      setCommunityPosts((current) => [created, ...current]);
      setFeaturedPost((current) => current ?? created);
      setEventDraft(emptyEvent);
      setEventImage(null);
      setMessage("Event posted to the community feed.");
      closeComposer();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not post this event.");
    } finally {
      setIsPosting(false);
    }
  }

  async function toggleLike(post: CommunityPost) {
    setError("");
    if (!token) {
      router.push("/(auth)/login");
      return;
    }

    const optimistic = {
      ...post,
      likedByMe: !post.likedByMe,
      likeCount: post.likeCount + (post.likedByMe ? -1 : 1)
    };
    replacePost(optimistic);

    try {
      const updated = await toggleCommunityPostLike(post.id, token);
      replacePost(updated);
      const result = await getCommunityPosts(token);
      setFeaturedPost(result.featuredPost);
    } catch (caught) {
      replacePost(post);
      setError(caught instanceof ApiError ? caught.message : "Could not update this like.");
    }
  }

  async function submitComment(post: CommunityPost) {
    setError("");
    const body = commentDrafts[post.id]?.trim() ?? "";
    if (!token) {
      router.push("/(auth)/login");
      return;
    }
    if (!body) {
      setError("Write a comment before posting.");
      return;
    }

    try {
      const updated = await addCommunityPostComment(post.id, body, token);
      replacePost(updated);
      setCommentDrafts((current) => ({ ...current, [post.id]: "" }));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not add this comment.");
    }
  }

  function renderPost({ item }: { item: CommunityPost }) {
    return (
      <View style={styles.post}>
        {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" /> : null}
        <View style={styles.postContent}>
          <View style={styles.postHeader}>
            <Badge label={item.type} tone={item.type === "event" ? "accent" : "light"} />
            <Text style={styles.date}>{item.dateLabel}</Text>
          </View>
          <Text style={styles.postTitle}>{item.title}</Text>
          <Text style={styles.summary}>{item.summary}</Text>
          {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
          <Text style={styles.author}>Posted by {item.authorName ?? "Campus member"}</Text>

          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={() => toggleLike(item)} style={[styles.actionPill, item.likedByMe && styles.actionPillActive]}>
              <FontAwesome name={item.likedByMe ? "heart" : "heart-o"} size={16} color={item.likedByMe ? colors.white : colors.ink} />
              <Text style={[styles.actionText, item.likedByMe && styles.actionTextActive]}>{item.likeCount}</Text>
            </Pressable>
            <View style={styles.actionPill}>
              <Feather name="message-circle" size={17} color={colors.ink} />
              <Text style={styles.actionText}>{item.commentCount}</Text>
            </View>
          </View>

          {item.comments.slice(0, 2).map((comment) => (
            <View key={comment.id} style={styles.comment}>
              <Text style={styles.commentAuthor}>{comment.authorName}</Text>
              <Text style={styles.commentBody}>{comment.body}</Text>
            </View>
          ))}

          <View style={styles.commentBox}>
            <TextInput
              onChangeText={(value) => setCommentDrafts((current) => ({ ...current, [item.id]: value }))}
              placeholder={token ? "Add a comment" : "Sign in to comment"}
              placeholderTextColor={colors.subtle}
              style={styles.commentInput}
              value={commentDrafts[item.id] ?? ""}
            />
            <Pressable accessibilityRole="button" onPress={() => submitComment(item)} style={styles.sendButton}>
              <Feather name="send" size={17} color={colors.white} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <FlatList
          data={communityPosts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>Community</Text>
              <Text style={styles.subtitle}>Post campus events, rally support, and help the best ideas rise.</Text>

              {mostLiked ? (
                <View style={styles.hero}>
                  {mostLiked.imageUrl ? <Image source={{ uri: mostLiked.imageUrl }} style={styles.heroImage} resizeMode="cover" /> : null}
                  <View style={styles.heroOverlay} />
                  <View style={styles.heroContent}>
                    <Text style={styles.heroLabel}>Featured by likes</Text>
                    <Text style={styles.heroTitle}>{mostLiked.title}</Text>
                    <Text style={styles.heroSummary}>{mostLiked.summary}</Text>
                    <View style={styles.heroMeta}>
                      <FontAwesome name="heart" size={15} color={colors.white} />
                      <Text style={styles.heroMetaText}>{mostLiked.likeCount} likes</Text>
                      <Text style={styles.heroMetaText}>{mostLiked.dateLabel}</Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {message ? <Text accessibilityRole="alert" style={styles.success}>{message}</Text> : null}
              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              <Text style={styles.feedTitle}>Latest posts</Text>
            </View>
          }
          renderItem={renderPost}
          ListEmptyComponent={<CommunityEmptyState onCreate={openComposer} />}
        />

        <Pressable accessibilityRole="button" accessibilityLabel="Create community post" onPress={openComposer} style={styles.fab}>
          <Feather name="plus" size={29} color={colors.white} />
        </Pressable>
      </View>

      <Modal animationType="none" transparent visible={composerOpen} onRequestClose={closeComposer}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={closeComposer} />
          <Animated.View {...sheetPanResponder.panHandlers} style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>New event post</Text>
                <Text style={styles.sheetSubtitle}>Give people enough context to decide quickly.</Text>
              </View>
              <Pressable accessibilityLabel="Close composer" onPress={closeComposer} style={styles.closeButton}>
                <Feather name="x" size={20} color={colors.ink} />
              </Pressable>
            </View>

            <Pressable accessibilityRole="button" onPress={chooseEventImage} style={styles.imagePicker}>
              {eventImage ? (
                <Image source={{ uri: eventImage.uri }} style={styles.imagePreview} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Feather name="image" size={24} color={colors.accent} />
                  <Text style={styles.imagePlaceholderText}>Add event image</Text>
                </View>
              )}
            </Pressable>

            <TextInput placeholder="Event title" placeholderTextColor={colors.subtle} style={styles.input} value={eventDraft.title} onChangeText={(title) => setEventDraft((current) => ({ ...current, title }))} />
            <TextInput placeholder="Short summary" placeholderTextColor={colors.subtle} style={styles.input} value={eventDraft.summary} onChangeText={(summary) => setEventDraft((current) => ({ ...current, summary }))} />
            <TextInput placeholder="Date, time, or venue" placeholderTextColor={colors.subtle} style={styles.input} value={eventDraft.dateLabel} onChangeText={(dateLabel) => setEventDraft((current) => ({ ...current, dateLabel }))} />
            <TextInput multiline placeholder="Event details" placeholderTextColor={colors.subtle} style={[styles.input, styles.bodyInput]} textAlignVertical="top" value={eventDraft.body} onChangeText={(body) => setEventDraft((current) => ({ ...current, body }))} />

            <Pressable accessibilityRole="button" disabled={isPosting} onPress={submitEvent} style={[styles.primaryButton, isPosting && styles.disabled]}>
              <Text style={styles.primaryText}>{isPosting ? "Posting..." : "Publish Event"}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1
  },
  screen: {
    flex: 1
  },
  list: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: 110
  },
  header: {
    gap: spacing.md
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    minHeight: 220,
    overflow: "hidden"
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    height: "100%",
    width: "100%"
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.46)"
  },
  heroContent: {
    gap: spacing.sm,
    justifyContent: "flex-end",
    minHeight: 220,
    padding: spacing.lg
  },
  heroLabel: {
    color: colors.yellow,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  heroTitle: {
    color: colors.white,
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 30
  },
  heroSummary: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.9
  },
  heroMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  heroMetaText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700"
  },
  feedTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: "900"
  },
  post: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: "hidden"
  },
  postImage: {
    height: 176,
    width: "100%"
  },
  postContent: {
    gap: spacing.sm,
    padding: spacing.md
  },
  postHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  postTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  summary: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  },
  author: {
    color: colors.subtle,
    fontSize: 12,
    fontWeight: "700"
  },
  date: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "800"
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  actionPill: {
    alignItems: "center",
    borderColor: colors.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.md
  },
  actionPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  actionText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  actionTextActive: {
    color: colors.white
  },
  comment: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    gap: 2,
    padding: spacing.sm
  },
  commentAuthor: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "900"
  },
  commentBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18
  },
  commentBox: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  commentInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    color: colors.ink,
    flex: 1,
    minHeight: 42,
    paddingHorizontal: spacing.md
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  fab: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    bottom: spacing.xl,
    height: 62,
    justifyContent: "center",
    position: "absolute",
    right: spacing.xl,
    shadowColor: colors.accent,
    shadowOpacity: 0.34,
    shadowRadius: 12,
    elevation: 8,
    width: 62
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end"
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)"
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: spacing.md,
    maxHeight: "92%",
    padding: spacing.lg,
    paddingBottom: spacing.xl
  },
  sheetHandle: {
    alignSelf: "center",
    backgroundColor: colors.line,
    borderRadius: radii.pill,
    height: 4,
    width: 44
  },
  sheetHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sheetTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "900"
  },
  sheetSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 3
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  imagePicker: {
    backgroundColor: "rgba(241,90,36,0.08)",
    borderColor: colors.accent,
    borderStyle: "dashed",
    borderRadius: radii.md,
    borderWidth: 1.5,
    height: 118,
    overflow: "hidden"
  },
  imagePreview: {
    height: "100%",
    width: "100%"
  },
  imagePlaceholder: {
    alignItems: "center",
    backgroundColor: "rgba(241,90,36,0.08)",
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center"
  },
  imagePlaceholderText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "800"
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.ink,
    minHeight: 46,
    paddingHorizontal: spacing.md
  },
  bodyInput: {
    minHeight: 96,
    paddingTop: spacing.md
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    justifyContent: "center",
    minHeight: 48
  },
  primaryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900"
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl
  },
  emptyArt: {
    alignItems: "center",
    height: 156,
    justifyContent: "center",
    width: 210
  },
  emptyPulse: {
    backgroundColor: "rgba(241,90,36,0.18)",
    borderRadius: 72,
    height: 144,
    position: "absolute",
    width: 144
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    shadowColor: colors.ink,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    width: 156
  },
  emptyCardImage: {
    alignItems: "center",
    backgroundColor: "rgba(241,90,36,0.1)",
    borderRadius: radii.sm,
    height: 54,
    justifyContent: "center",
    marginBottom: spacing.md
  },
  emptyCardLineLarge: {
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    height: 8,
    opacity: 0.82,
    width: "74%"
  },
  emptyCardLineSmall: {
    backgroundColor: colors.line,
    borderRadius: radii.pill,
    height: 7,
    marginTop: spacing.sm,
    width: "54%"
  },
  emptyCardStats: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  emptyStat: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5
  },
  emptyStatText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "900"
  },
  emptyCopy: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 270,
    textAlign: "center"
  },
  emptyButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    marginTop: spacing.sm,
    minHeight: 42,
    paddingHorizontal: spacing.lg
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900"
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center"
  },
  success: {
    color: colors.success,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center"
  },
  disabled: {
    opacity: 0.6
  }
});
