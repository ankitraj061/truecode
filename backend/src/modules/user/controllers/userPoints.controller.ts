import User from '../models/user.js';
import { sendError } from '../../../contracts/apiResponse.js';

/**
 * GET /api/user/points
 * Returns the authenticated user's current points balance.
 */
export const getPoints = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).select('points').lean();
        if (!user) {
            return sendError(res, 404, 'User not found');
        }

        return res.status(200).json({ success: true, points: user.points ?? 0 });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

/**
 * POST /api/user/points/add
 * Admin-only endpoint — adds (or subtracts) points for a target user.
 * Body: { userId: string, amount: number, reason: string }
 */
export const addPoints = async (req, res) => {
    try {
        const { userId, amount, reason } = req.body;

        if (!userId) {
            return sendError(res, 400, '`userId` is required');
        }

        if (amount === undefined || typeof amount !== 'number') {
            return sendError(res, 400, '`amount` must be a number');
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $inc: { points: amount } },
            { new: true, select: 'points' }
        );

        if (!user) {
            return sendError(res, 404, 'User not found');
        }

        return res.status(200).json({
            success: true,
            points: user.points,
            applied: amount,
            reason: reason || 'manual adjustment'
        });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};
