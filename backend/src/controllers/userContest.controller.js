import Contest from "../models/contest.js";
import Problem from "../models/problem.js";
import Submission from "../models/submission.js";
import User from "../models/user.js";
import mongoose from "mongoose";

function computeStatus(startTime, endTime) {
    const now = new Date();
    if (now < startTime) return "upcoming";
    if (now > endTime) return "ended";
    return "running";
}

/**
 * GET /api/user/contest/list?status=upcoming|running|ended&page=1&limit=20
 */
export const listContests = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const userId = req.user?._id;
        const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, Math.min(100, parseInt(limit, 10)));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));

        const now = new Date();
        let match = {};
        if (status === "upcoming") match = { startTime: { $gt: now } };
        else if (status === "running") match = { startTime: { $lte: now }, endTime: { $gt: now } };
        else if (status === "ended") match = { endTime: { $lte: now } };

        const [contests, total] = await Promise.all([
            Contest.find(match)
                .sort({ startTime: -1 })
                .skip(skip)
                .limit(limitNum)
                .select("title description startTime endTime duration status type participants problems")
                .lean(),
            Contest.countDocuments(match),
        ]);

        const contestsWithMeta = contests.map((c) => {
            const st = computeStatus(c.startTime, c.endTime);
            const registered = userId && c.participants?.some((p) => p.userId?.toString() === userId.toString());
            return {
                _id: c._id,
                title: c.title,
                description: c.description,
                startTime: c.startTime,
                endTime: c.endTime,
                duration: c.duration,
                status: st,
                type: c.type,
                participantCount: c.participants?.length ?? 0,
                registered: !!registered,
            };
        });

        return res.status(200).json({ contests: contestsWithMeta, total });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/user/contest/:contestId
 * For upcoming contests, problems are not public: only order is returned (no _id, title, slug).
 * When contest has ended, problems are activated (isActive=true) so they appear on the normal problems page.
 */
export const getContest = async (req, res) => {
    try {
        const { contestId } = req.params;
        const userId = req.user?._id;

        const contest = await Contest.findById(contestId)
            .select("title description startTime endTime duration status type participants problems problemScores problemsActivated")
            .lean();
        if (!contest) return res.status(404).json({ error: "Contest not found" });

        const status = computeStatus(contest.startTime, contest.endTime);
        const registered = userId && contest.participants?.some((p) => p.userId?.toString() === userId.toString());

        // When contest has ended, activate all contest problems so they appear on the normal problems page (once per contest)
        if (status === "ended" && !contest.problemsActivated && contest.problems?.length) {
            await Promise.all([
                Problem.updateMany(
                    { _id: { $in: contest.problems } },
                    { $set: { isActive: true } }
                ),
                Contest.updateOne(
                    { _id: contestId },
                    { $set: { problemsActivated: true } }
                ),
            ]);
            contest.problemsActivated = true;
        }

        // For upcoming contests, do not expose problem details (no _id, title, slug) — problems are not public yet
        if (status === "upcoming") {
            const problems = (contest.problems || []).map((_, idx) => ({
                order: idx + 1,
            }));
            return res.status(200).json({
                contest: {
                    _id: contest._id,
                    title: contest.title,
                    description: contest.description,
                    startTime: contest.startTime,
                    endTime: contest.endTime,
                    duration: contest.duration,
                    status,
                    type: contest.type,
                    participantCount: contest.participants?.length ?? 0,
                    registered: !!registered,
                    problems,
                },
            });
        }

        // Running or ended: populate problem details
        const populated = await Contest.findById(contestId)
            .populate("problems", "title slug difficulty _id")
            .populate("problemScores.problemId", "_id")
            .lean();
        const c = populated || contest;
        const problemScoresMap = {};
        (c.problemScores || []).forEach(({ problemId, score }) => {
            if (problemId?._id) problemScoresMap[problemId._id.toString()] = score;
        });

        const problems = (c.problems || []).map((p, idx) => ({
            _id: p._id,
            title: p.title,
            slug: p.slug,
            difficulty: p.difficulty,
            order: idx + 1,
            score: problemScoresMap[p._id.toString()] ?? (p.difficulty === "easy" ? 1 : p.difficulty === "medium" ? 2 : 3),
        }));

        return res.status(200).json({
            contest: {
                _id: contest._id,
                title: contest.title,
                description: contest.description,
                startTime: contest.startTime,
                endTime: contest.endTime,
                duration: contest.duration,
                status,
                type: contest.type,
                participantCount: contest.participants?.length ?? 0,
                registered: !!registered,
                problems,
            },
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/user/contest/:contestId/register
 */
export const registerContest = async (req, res) => {
    try {
        const { contestId } = req.params;
        const userId = req.user._id;

        const contest = await Contest.findById(contestId);
        if (!contest) return res.status(404).json({ error: "Contest not found" });

        const status = computeStatus(contest.startTime, contest.endTime);
        if (status !== "upcoming")
            return res.status(400).json({ error: "Registration is only open for upcoming contests" });

        const already = contest.participants?.some((p) => p.userId?.toString() === userId.toString());
        if (already) return res.status(200).json({ message: "Already registered", registered: true });

        contest.participants = contest.participants || [];
        contest.participants.push({
            userId,
            registeredAt: new Date(),
            score: 0,
            penalty: 0,
        });
        await contest.save();
        return res.status(200).json({ message: "Registered successfully", registered: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const PENALTY_MINUTES_PER_WA = 5;

/**
 * GET /api/user/contest/:contestId/leaderboard?page=1&limit=50
 * Compute from submissions with contestId: first AC + wrong count per (user, problem), then score + totalTime.
 */
export const getLeaderboard = async (req, res) => {
    try {
        const { contestId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, Math.min(100, parseInt(limit, 10)));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));

        const contest = await Contest.findById(contestId).lean();
        if (!contest) return res.status(404).json({ error: "Contest not found" });

        const problemIds = (contest.problems || []).map((p) => p.toString());
        const scoreMap = {};
        (contest.problemScores || []).forEach(({ problemId, score }) => {
            const id = problemId?.toString?.() || problemId;
            if (id) scoreMap[id] = score;
        });
        const startTime = new Date(contest.startTime);

        const submissions = await Submission.find({
            contestId: new mongoose.Types.ObjectId(contestId),
            problemId: { $in: problemIds.map((id) => new mongoose.Types.ObjectId(id)) },
        })
            .sort({ createdAt: 1 })
            .lean();

        const userStats = {};
        submissions.forEach((sub) => {
            const uid = sub.userId.toString();
            const pid = sub.problemId.toString();
            if (!problemIds.includes(pid)) return;
            if (!userStats[uid]) {
                userStats[uid] = { score: 0, penaltyMinutes: 0, lastACTime: null, solved: {}, wrongCountByProblem: {} };
            }
            const u = userStats[uid];
            if (sub.status === "accepted") {
                if (!u.solved[pid] || !u.solved[pid].firstACTime) {
                    const problemScore = scoreMap[pid] ?? 1;
                    u.score += problemScore;
                    const firstACTime = new Date(sub.createdAt);
                    u.lastACTime = u.lastACTime ? new Date(Math.max(u.lastACTime.getTime(), firstACTime.getTime())) : firstACTime;
                    const wrongBefore = u.wrongCountByProblem[pid] || 0;
                    u.penaltyMinutes += wrongBefore * PENALTY_MINUTES_PER_WA;
                    u.solved[pid] = { wrongCount: wrongBefore, firstACTime };
                }
            } else {
                u.wrongCountByProblem[pid] = (u.wrongCountByProblem[pid] || 0) + 1;
            }
        });

        let leaderboard = Object.entries(userStats)
            .filter(([, u]) => u.score > 0)
            .map(([userId, u]) => ({
                userId,
                score: u.score,
                penaltyMinutes: u.penaltyMinutes,
                lastACTime: u.lastACTime,
                totalTimeMinutes: u.lastACTime
                    ? (u.lastACTime.getTime() - startTime.getTime()) / (60 * 1000) + u.penaltyMinutes
                    : 0,
                solvedProblems: Object.keys(u.solved || {}).filter((pid) => u.solved[pid].firstACTime),
            }))
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return a.totalTimeMinutes - b.totalTimeMinutes;
            });

        const total = leaderboard.length;
        leaderboard = leaderboard.slice(skip, skip + limitNum);

        const userIds = [...new Set(leaderboard.map((e) => e.userId))];
        const users = await User.find({ _id: { $in: userIds } }).select("username _id").lean();
        const userMap = {};
        users.forEach((u) => { userMap[u._id.toString()] = u.username; });

        const leaderboardWithNames = leaderboard.map((row, idx) => ({
            rank: skip + idx + 1,
            userId: row.userId,
            username: userMap[row.userId] || "—",
            score: row.score,
            penalty: row.penaltyMinutes,
            totalTimeMinutes: Math.round(row.totalTimeMinutes * 100) / 100,
            solvedProblems: row.solvedProblems,
        }));

        return res.status(200).json({ leaderboard: leaderboardWithNames, total });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/user/contest/:contestId/problem/:problemId
 * Same shape as normal problem but omit editorial/solution until contest ended.
 */
export const getContestProblem = async (req, res) => {
    try {
        const { contestId, problemId } = req.params;
        const userId = req.user._id;

        const contest = await Contest.findById(contestId).lean();
        if (!contest) return res.status(404).json({ error: "Contest not found" });
        const problemIds = (contest.problems || []).map((p) => p.toString());
        if (!problemIds.includes(problemId))
            return res.status(404).json({ error: "Problem not in this contest" });

        const status = computeStatus(contest.startTime, contest.endTime);
        const ended = status === "ended";

        const problem = await Problem.findById(problemId).lean();
        if (!problem) return res.status(404).json({ error: "Problem not found" });

        const problemPayload = {
            _id: problem._id,
            slug: problem.slug,
            title: problem.title,
            description: problem.description,
            difficulty: problem.difficulty,
            constraints: problem.constraints,
            visibleTestCases: problem.visibleTestCases,
            startCode: problem.startCode,
            hints: problem.hints,
            companies: problem.companies,
            tags: problem.tags,
        };
        if (ended) {
            problemPayload.referenceSolution = problem.referenceSolution;
            problemPayload.editorialContent = problem.editorialContent;
        }

        const userStatus = await User.findById(userId).select("preferences.preferredLanguage").lean();
        return res.status(200).json({
            success: true,
            problem: problemPayload,
            contest: {
                _id: contest._id,
                title: contest.title,
                startTime: contest.startTime,
                endTime: contest.endTime,
                status,
            },
            userStatus: {
                preferredLanguage: userStatus?.preferences?.preferredLanguage || "javascript",
            },
            showEditorial: ended,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/user/contest/my?status=upcoming|running|ended
 */
export const myContests = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status } = req.query;

        const contests = await Contest.find({
            "participants.userId": userId,
        })
            .sort({ startTime: -1 })
            .select("title description startTime endTime duration status type participants problems")
            .lean();

        let filtered = contests;
        if (status) {
            const now = new Date();
            if (status === "upcoming") filtered = contests.filter((c) => new Date(c.startTime) > now);
            else if (status === "running") filtered = contests.filter((c) => new Date(c.startTime) <= now && new Date(c.endTime) > now);
            else if (status === "ended") filtered = contests.filter((c) => new Date(c.endTime) <= now);
        }

        const list = filtered.map((c) => {
            const st = computeStatus(c.startTime, c.endTime);
            return {
                _id: c._id,
                title: c.title,
                description: c.description,
                startTime: c.startTime,
                endTime: c.endTime,
                duration: c.duration,
                status: st,
                type: c.type,
                participantCount: c.participants?.length ?? 0,
                registered: true,
            };
        });

        return res.status(200).json({ contests: list, total: list.length });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
