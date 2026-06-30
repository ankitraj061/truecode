import type { Request, Response, NextFunction } from "express";

export const emailVerificationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // if (!req.user) {
        //     throw new Error('User not authenticated');
        // }

        // if (!req.user.isEmailVerified) {
        //     return res.status(403).json({
        //         error: 'Email verification required. Please verify your email to access this feature.',
        //         action: 'email_verification_required'
        //     });
        // }

        next();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
