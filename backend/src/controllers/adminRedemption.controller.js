import Redemption from '../models/redemption.js';

/**
 * GET /api/admin/redemptions
 * Returns all redemption orders with optional status filter and pagination.
 * Query params: status, page, limit
 */
export const getAllRedemptions = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const skip = (pageNumber - 1) * limitNumber;

        const filter = {};
        if (status) {
            filter.status = status;
        }

        const [redemptions, total] = await Promise.all([
            Redemption.find(filter)
                .populate('userId', 'firstName lastName username emailId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber),
            Redemption.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            redemptions,
            total,
            page: pageNumber,
            limit: limitNumber,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PATCH /api/admin/redemptions/:id/status
 * Updates the status of a redemption order and appends to statusHistory.
 * Body: { status, note }
 */
export const updateRedemptionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: '`status` is required' });
        }

        const redemption = await Redemption.findById(id);
        if (!redemption) {
            return res.status(404).json({ success: false, message: 'Redemption not found' });
        }

        redemption.status = status;
        redemption.statusHistory.push({ status, note: note || '' });
        await redemption.save();

        return res.status(200).json({ success: true, redemption });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
