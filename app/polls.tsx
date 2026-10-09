import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getOpenPolls, submitPollVote, type PollView } from "../src/api/pollApi";
import { useAuth } from "../src/contexts/AuthContext";
import { colors, radii, spacing } from "../src/theme/theme";

export default function PollsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [polls, setPolls] = useState<PollView[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyPoll, setBusyPoll] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setPolls(await getOpenPolls(token ?? undefined)); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load polls."); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  async function vote(poll: PollView, optionIndex: number) {
    if (!token) { Alert.alert("Sign in to vote", "Poll results are visible, but you need an account to submit a vote."); return; }
    setBusyPoll(poll._id);
    try { await submitPollVote(token, poll._id, optionIndex); await load(); }
    catch (cause) { Alert.alert("Vote not submitted", cause instanceof Error ? cause.message : "Please try again."); }
    finally { setBusyPoll(null); }
  }

  return <SafeAreaView style={styles.safe}>
    <View style={styles.header}>
      <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Feather name="chevron-left" size={24} color={colors.ink} /></Pressable>
      <Text style={styles.title}>Campus polls</Text><View style={styles.back} />
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.intro}>Share your view on campus topics. Each account can vote once per poll.</Text>
      {loading && <Text style={styles.info}>Loading polls…</Text>}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!loading && !error && polls.length === 0 && <Text style={styles.info}>There are no open polls right now.</Text>}
      {polls.map((poll) => {
        const total = poll.voteCounts.reduce((sum, count) => sum + count, 0);
        return <View key={poll._id} style={styles.card}>
          <Text style={styles.question}>{poll.question}</Text>
          {poll.description ? <Text style={styles.description}>{poll.description}</Text> : null}
          {poll.options.map((option, index) => {
            const count = poll.voteCounts[index] ?? 0;
            const percentage = total ? Math.round(count * 100 / total) : 0;
            return <Pressable key={`${poll._id}-${index}`} accessibilityRole="button" disabled={poll.hasVoted || busyPoll === poll._id} onPress={() => void vote(poll, index)} style={[styles.option, poll.hasVoted && styles.optionResults]}>
              <View style={styles.optionRow}><Text style={styles.optionText}>{option}</Text>{poll.hasVoted ? <Text style={styles.count}>{percentage}% · {count}</Text> : <Feather name="circle" size={18} color={colors.muted} />}</View>
              {poll.hasVoted ? <View style={styles.track}><View style={[styles.fill, { width: `${percentage}%` }]} /></View> : null}
            </Pressable>;
          })}
          <Text style={styles.footer}>{poll.hasVoted ? `Your vote is recorded · ${total} total votes` : token ? "Select one option to vote" : "Sign in to vote"}</Text>
        </View>;
      })}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: spacing.lg },
  back: { width: 44, height: 44, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  title: { color: colors.ink, fontSize: 22, fontWeight: "900" },
  content: { padding: spacing.lg, paddingTop: 0, gap: spacing.md },
  intro: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: spacing.sm },
  info: { color: colors.muted, textAlign: "center", padding: spacing.xl },
  error: { color: colors.danger, padding: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, gap: spacing.sm },
  question: { color: colors.ink, fontSize: 18, fontWeight: "800" },
  description: { color: colors.muted, fontSize: 14 },
  option: { borderColor: colors.line, borderWidth: 1, borderRadius: radii.md, padding: spacing.md, gap: spacing.sm },
  optionResults: { backgroundColor: colors.background },
  optionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  optionText: { color: colors.ink, fontSize: 14, flex: 1 },
  count: { color: colors.accent, fontWeight: "800", fontSize: 12 },
  track: { height: 5, backgroundColor: colors.line, borderRadius: radii.pill, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.accent },
  footer: { color: colors.muted, fontSize: 12, marginTop: spacing.xs }
});
