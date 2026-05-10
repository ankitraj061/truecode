import Contest from "../models/contest.js";
import Problem from "../models/problem.js";
import mongoose from "mongoose";

const DIFFICULTY_SCORE = { easy: 1, medium: 2, hard: 3 };

function computeStatus(startTime, endTime) {
    const now = new Date();
    if (now < startTime) return "upcoming";
    if (now > endTime) return "ended";
    return "running";
}

/**
 * GET /api/admin/contest/available-problems
 * Returns only problems where isActive === false (inactive), for contest creation.
 */
export const getAvailableProblemsForContest = async (req, res) => {
    try {
        const problems = await Problem.find(
            { isActive: false },
            { title: 1, slug: 1, difficulty: 1, _id: 1 }
        )
            .sort({ title: 1 })
            .lean();
        return res.status(200).json({ problems });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/admin/contest
 * Create contest. problemIds must reference only inactive problems (isActive === false).
 */
export const createContest = async (req, res) => {
    try {
        const {
            title,
            description,
            startTime,
            endTime,
            problemIds = [],
            type = "public",
            maxParticipants,
            problemScores: problemScoresInput,
        } = req.body;
        const createdBy = req.user._id;

        if (!title || !description || !startTime || !endTime)
            return res.status(400).json({ error: "Missing required fields: title, description, startTime, endTime" });

        const start = new Date(startTime);
        const end = new Date(endTime);
        if (isNaN(start.getTime()) || isNaN(end.getTime()))
            return res.status(400).json({ error: "Invalid startTime or endTime" });
        if (end <= start)
            return res.status(400).json({ error: "endTime must be after startTime" });

        // Derive duration in minutes from start/end
        const rawDurationMinutes = Math.round((end.getTime() - start.getTime()) / (60 * 1000));
        const durationMinutes = Math.max(1, rawDurationMinutes);

        const validTypes = ["public", "private", "educational"];
        if (!validTypes.includes(type))
            return res.status(400).json({ error: "Invalid type" });

        const uniqueIds = [...new Set(problemIds.map((id) => id?.toString()).filter(Boolean))];
        if (uniqueIds.length === 0)
            return res.status(400).json({ error: "At least one problem is required" });

        const problems = await Problem.find({
            _id: { $in: uniqueIds.map((id) => new mongoose.Types.ObjectId(id)) },
        }).lean();

        const notFound = uniqueIds.filter(
            (id) => !problems.some((p) => p._id.toString() === id)
        );
        if (notFound.length)
            return res.status(400).json({
                error: "Some problem IDs were not found",
                notFound,
            });

        const activeProblems = problems.filter((p) => p.isActive);
        if (activeProblems.length > 0)
            return res.status(400).json({
                error: "Contest can only include inactive problems (isActive: false). One or more selected problems are active.",
                activeIds: activeProblems.map((p) => p._id.toString()),
            });

        const orderPreserved = uniqueIds.map((id) =>
            problems.find((p) => p._id.toString() === id)?._id
        ).filter(Boolean);

        const problemScores = [];
        if (Array.isArray(problemScoresInput) && problemScoresInput.length) {
            problemScoresInput.forEach(({ problemId, score }) => {
                if (orderPreserved.some((oid) => oid.toString() === problemId?.toString()) && typeof score === "number")
                    problemScores.push({ problemId: new mongoose.Types.ObjectId(problemId), score });
            });
        }
        if (problemScores.length !== orderPreserved.length) {
            orderPreserved.forEach((pid) => {
                if (problemScores.some((ps) => ps.problemId.toString() === pid.toString())) return;
                const p = problems.find((x) => x._id.toString() === pid.toString());
                problemScores.push({
                    problemId: pid,
                    score: DIFFICULTY_SCORE[p?.difficulty] ?? 1,
                });
            });
        }

        const status = computeStatus(start, end);
        const contest = await Contest.create({
            title,
            description,
            startTime: start,
            endTime: end,
            duration: durationMinutes,
            problems: orderPreserved,
            problemScores: problemScores.length ? problemScores : orderPreserved.map((pid) => {
                const p = problems.find((x) => x._id.toString() === pid.toString());
                return { problemId: pid, score: DIFFICULTY_SCORE[p?.difficulty] ?? 1 };
            }),
            participants: [],
            type,
            maxParticipants: maxParticipants != null ? Number(maxParticipants) : undefined,
            createdBy,
            status,
        });

        const populated = await Contest.findById(contest._id)
            .populate("problems", "title slug difficulty")
            .populate("createdBy", "username")
            .lean();
        return res.status(201).json({ contest: populated });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/admin/contest
 * List all contests (admin).
 */
export const listContestsAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, Math.min(100, parseInt(limit, 10)));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));

        const [contests, total] = await Promise.all([
            Contest.find()
                .sort({ startTime: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate("problems", "title slug difficulty")
                .populate("createdBy", "username")
                .lean(),
            Contest.countDocuments(),
        ]);

        return res.status(200).json({
            contests: contests.map((c) => ({
                _id: c._id,
                title: c.title,
                description: c.description,
                startTime: c.startTime,
                endTime: c.endTime,
                duration: c.duration,
                status: computeStatus(c.startTime, c.endTime),
                type: c.type,
                participantCount: c.participants?.length ?? 0,
            })),
            total,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/admin/contest/:contestId
 */
export const getContestAdmin = async (req, res) => {
    try {
        const { contestId } = req.params;
        const contest = await Contest.findById(contestId)
            .populate("problems", "title slug difficulty _id")
            .populate("createdBy", "username")
            .lean();
        if (!contest)
            return res.status(404).json({ error: "Contest not found" });
        const status = computeStatus(contest.startTime, contest.endTime);
        return res.status(200).json({ contest: { ...contest, status } });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * PATCH /api/admin/contest/:contestId
 * Update contest. If problemIds provided, validate again that all are inactive.
 */
export const updateContestAdmin = async (req, res) => {
    try {
        const { contestId } = req.params;
        const {
            title,
            description,
            startTime,
            endTime,
            problemIds,
            type,
            maxParticipants,
            problemScores: problemScoresInput,
        } = req.body;

        const contest = await Contest.findById(contestId);
        if (!contest)
            return res.status(404).json({ error: "Contest not found" });

        if (title != null) contest.title = title;
        if (description != null) contest.description = description;
        if (startTime != null) contest.startTime = new Date(startTime);
        if (endTime != null) contest.endTime = new Date(endTime);
        if (type != null) {
            if (!["public", "private", "educational"].includes(type))
                return res.status(400).json({ error: "Invalid type" });
            contest.type = type;
        }
        if (maxParticipants !== undefined) contest.maxParticipants = maxParticipants == null ? undefined : Number(maxParticipants);

        if (Array.isArray(problemIds) && problemIds.length > 0) {
            const uniqueIds = [...new Set(problemIds.map((id) => id?.toString()).filter(Boolean))];
            const currentIds = (contest.problems || []).map((p) => p.toString());
            const newIds = uniqueIds.filter((id) => !currentIds.includes(id));
            const problems = await Problem.find({
                _id: { $in: uniqueIds.map((id) => new mongoose.Types.ObjectId(id)) },
            }).lean();
            const problemMap = {};
            problems.forEach((p) => { problemMap[p._id.toString()] = p; });
            // Only new additions must be inactive; existing contest problems may have been activated after contest ended
            const activeNew = newIds.filter((id) => problemMap[id]?.isActive);
            if (activeNew.length > 0)
                return res.status(400).json({
                    error: "New problems added to the contest must be inactive (isActive: false).",
                    activeIds: activeNew,
                });
            const orderPreserved = uniqueIds
                .map((id) => problems.find((p) => p._id.toString() === id)?._id)
                .filter(Boolean);
            contest.problems = orderPreserved;
            if (Array.isArray(problemScoresInput) && problemScoresInput.length) {
                contest.problemScores = problemScoresInput
                    .filter(({ problemId, score }) => orderPreserved.some((oid) => oid.toString() === problemId?.toString()) && typeof score === "number")
                    .map(({ problemId, score }) => ({ problemId: new mongoose.Types.ObjectId(problemId), score }));
            } else {
                contest.problemScores = orderPreserved.map((pid) => {
                    const p = problems.find((x) => x._id.toString() === pid.toString());
                    return { problemId: pid, score: DIFFICULTY_SCORE[p?.difficulty] ?? 1 };
                });
            }
        } else if (Array.isArray(problemScoresInput) && problemScoresInput.length) {
            contest.problemScores = problemScoresInput
                .filter(({ problemId, score }) => contest.problems.some((oid) => oid.toString() === problemId?.toString()) && typeof score === "number")
                .map(({ problemId, score }) => ({ problemId: new mongoose.Types.ObjectId(problemId), score }));
        }

        // Recompute duration from updated start/end times
        if (contest.startTime && contest.endTime) {
            const rawDurationMinutes = Math.round(
                (contest.endTime.getTime() - contest.startTime.getTime()) / (60 * 1000)
            );
            contest.duration = Math.max(1, rawDurationMinutes);
        }

        contest.status = computeStatus(contest.startTime, contest.endTime);
        await contest.save();

        const populated = await Contest.findById(contest._id)
            .populate("problems", "title slug difficulty")
            .populate("createdBy", "username")
            .lean();
        return res.status(200).json({ contest: { ...populated, status: contest.status } });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

/**
 * DELETE /api/admin/contest/:contestId
 */
export const deleteContestAdmin = async (req, res) => {
    try {
        const { contestId } = req.params;
        const contest = await Contest.findByIdAndDelete(contestId);
        if (!contest)
            return res.status(404).json({ error: "Contest not found" });
        return res.status(200).json({ message: "Contest deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
