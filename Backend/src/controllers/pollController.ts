import type { Request, Response } from "express";
import { Poll } from "../models/Poll";
import { PollVote } from "../models/PollVote";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

export const listOpenPolls = asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();
  const polls = await Poll.find({ status: "open", $and: [{ $or: [{ startsAt: null }, { startsAt: { $lte: now } }] }, { $or: [{ endsAt: null }, { endsAt: { $gt: now } }] }] }).sort({ createdAt: -1 }).lean();
  const userId = req.user?.id;
  const votedIds = userId ? new Set((await PollVote.find({ user: userId, poll: { $in: polls.map((poll) => poll._id) } }).distinct("poll")).map(String)) : new Set<string>();
  const results = await PollVote.aggregate([{ $match: { poll: { $in: polls.map((poll) => poll._id) } } }, { $group: { _id: { poll: "$poll", optionIndex: "$optionIndex" }, votes: { $sum: 1 } } }]);
  const counts = new Map(results.map((row) => [`${row._id.poll}:${row._id.optionIndex}`, row.votes]));
  sendSuccess(res, { polls: polls.map((poll) => {
    const hasVoted = votedIds.has(String(poll._id));
    return { ...poll, hasVoted, voteCounts: hasVoted ? poll.options.map((_, index) => counts.get(`${poll._id}:${index}`) ?? 0) : [] };
  }) });
});

export const voteOnPoll = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError("Sign in to vote", 401);
  const poll = await Poll.findById(req.params.id);
  if (!poll) throw new AppError("Poll not found", 404);
  const now = new Date();
  if (poll.status !== "open" || (poll.startsAt && poll.startsAt > now) || (poll.endsAt && poll.endsAt <= now)) throw new AppError("This poll is not currently open", 409);
  const optionIndex = Number(req.body.optionIndex);
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= poll.options.length) throw new AppError("Choose a valid poll option", 400);
  try {
    await PollVote.create({ poll: poll._id, user: userId, optionIndex });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) throw new AppError("You have already voted in this poll", 409);
    throw error;
  }
  sendSuccess(res, { pollId: poll._id }, "Vote recorded");
});
