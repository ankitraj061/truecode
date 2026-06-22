import type { Request, Response, NextFunction } from "express";

export const activeAccountMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            throw new Error('User not authenticated');
        }

        if (!req.user.isActive) {
            return res.status(403).json({
                error: 'Your account has been suspended. Please contact support.',
                action: 'account_suspended'
            });
        }
        next();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
