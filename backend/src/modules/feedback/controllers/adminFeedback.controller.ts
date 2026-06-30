import Feedback from "../models/feedback.js";
import { sendError } from "../../../contracts/apiResponse.js";

// GET /api/admin/feedback
export const getAllFeedback = async (req, res) => {
    try {
        const { type, status, page = 1, limit = 20 } = req.query;

        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const skip = (pageNumber - 1) * limitNumber;

        const filter: Record<string, any> = {};
        if (type) filter.type = type;
        if (status) filter.status = status;

        const [feedback, total] = await Promise.all([
            Feedback.find(filter)
                .populate("userId", "firstName lastName emailId username")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber),
            Feedback.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            feedback,
            total,
            page: pageNumber,
            limit: limitNumber,
        });
    } catch (error) {
        sendError(res, 500, error.message);
    }
};

// PATCH /api/admin/feedback/:id/status
export const updateFeedbackStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["open", "resolved"].includes(status)) {
            return sendError(res, 400, "status must be 'open' or 'resolved'");
        }

        const feedback = await Feedback.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate("userId", "firstName lastName emailId username");

        if (!feedback) {
            return sendError(res, 404, "Feedback not found");
        }

        res.status(200).json({ success: true, feedback });
    } catch (error) {
        sendError(res, 500, error.message);
    }
};
