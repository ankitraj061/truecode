import User from '../models/user.js';
import Redemption from '../models/redemption.js';

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
            return res.status(400).json({ success: false, message: 'productId, productName, pointsSpent, and address are required' });
        }

        const user = await User.findById(userId).select('points');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.points < pointsSpent) {
            return res.status(400).json({ success: false, message: 'Insufficient points' });
        }

        // Deduct points atomically
        await User.findByIdAndUpdate(userId, { $inc: { points: -pointsSpent } });

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
        return res.status(500).json({ success: false, message: error.message });
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
        return res.status(500).json({ success: false, message: error.message });
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
        return res.status(500).json({ success: false, message: error.message });
    }
};
