import type { Request, Response, NextFunction } from "express";

export const premiumMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        const now = new Date();
        const isPremiumActive = req.user.subscriptionType === 'premium' &&
                               req.user.subscriptionExpiry &&
                               req.user.subscriptionExpiry > now;

        if (!isPremiumActive) {
            return res.status(403).json({
                error: 'Premium subscription required to access this feature.',
                action: 'upgrade_to_premium'
            });
        }

        next();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
