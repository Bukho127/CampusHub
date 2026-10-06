import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "../../src/components/Badge";
import type { CommunityPost } from "../../src/models/marketplace";
import { getCommunityPosts } from "../../src/services/communityService";
import { colors, spacing } from "../../src/theme/theme";

export default function CommunityScreen() {
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    getCommunityPosts().then(setCommunityPosts);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <Text style={styles.subtitle}>Announcements, events, and services are previewed here for Phase 1.</Text>
      </View>
      <FlatList
        data={communityPosts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.post}>
            <Badge label={item.type} tone="light" />
            <Text style={styles.postTitle}>{item.title}</Text>
            <Text style={styles.summary}>{item.summary}</Text>
            <Text style={styles.date}>{item.dateLabel}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1
  },
  header: {
    padding: spacing.lg
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6
  },
  list: {
    gap: 12,
    padding: spacing.lg
  },
  post: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    gap: 8,
    paddingBottom: 16
  },
  postTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900"
  },
  summary: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21
  },
  date: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "800"
  }
});
