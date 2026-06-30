import User from '../../user/models/user.js';
import Redemption from '../models/redemption.js';
import { sendError } from '../../../contracts/apiResponse.js';

/**
 * POST /api/redeem
 * Creates a new redemption order for the authenticated user.
 * Body: { productId, productName, pointsSpent, address }
 */
export const createRedemption = async (req, res) => {
    try {
        const userId = req.user._id;
        const { productId, productName, pointsSpent, address } = req.body;

        if (!productId || !productName || pointsSpent === undefined || pointsSpent === null || !address) {
            return sendError(res, 400, 'productId, productName, pointsSpent, and address are required');
        }

        if (!Number.isInteger(pointsSpent) || pointsSpent <= 0) {
            return sendError(res, 400, 'pointsSpent must be a positive integer');
        }

        // Atomically check balance and deduct in one step to avoid double-spend races
        const user = await User.findOneAndUpdate(
            { _id: userId, points: { $gte: pointsSpent } },
            { $inc: { points: -pointsSpent } }
        );

        if (!user) {
            const exists = await User.exists({ _id: userId });
            return sendError(res, exists ? 400 : 404, exists ? 'Insufficient points' : 'User not found');
        }

        const redemption = await Redemption.create({
            userId,
            productId,
            productName,
            pointsSpent,
            address,
            status: 'pending',
            statusHistory: [{ status: 'pending', note: 'Order placed' }],
        });

        return res.status(201).json({ success: true, redemption });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

/**
 * GET /api/redeem/my
 * Returns all redemption orders for the authenticated user, sorted newest first.
 */
export const getMyRedemptions = async (req, res) => {
    try {
        const userId = req.user._id;

        const redemptions = await Redemption.find({ userId })
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, redemptions });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};

/**
 * GET /api/redeem/my-address
 * Returns the address from the user's most recent redemption for pre-filling.
 */
export const getMyAddress = async (req, res) => {
    try {
        const userId = req.user._id;

        const lastRedemption = await Redemption.findOne({ userId })
            .sort({ createdAt: -1 })
            .select('address');

        const address = lastRedemption ? lastRedemption.address : null;

        return res.status(200).json({ success: true, address });
    } catch (error) {
        return sendError(res, 500, error.message);
    }
};
