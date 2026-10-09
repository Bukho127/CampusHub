import { apiRequest } from "./client";

export type PollView = {
  _id: string;
  question: string;
  description?: string;
  options: string[];
  status: "draft" | "open" | "closed";
  hasVoted: boolean;
  voteCounts: number[];
};

export async function getOpenPolls(token?: string) {
  const response = await apiRequest<{ polls: PollView[] }>("/polls", { token });
  return response.data.polls;
}

export function submitPollVote(token: string, pollId: string, optionIndex: number) {
  return apiRequest<{ pollId: string }>(`/polls/${pollId}/votes`, {
    method: "POST", token, body: JSON.stringify({ optionIndex })
  });
}
