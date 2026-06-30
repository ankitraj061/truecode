import type { Request, Response, NextFunction } from "express";
import { redisClient } from "../config/redis.js";
import User from "../modules/user/models/user.js";
import jwt from "jsonwebtoken";

export const optionalUserMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            req.user = null;
            return next();
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as any;
        const { _id } = payload;
        if (!_id) {
            req.user = null;
            return next();
        }

        const user = await User.findById(_id);
        if (!user) {
            req.user = null;
            return next();
        }

        const isBlocked = await redisClient.exists(`token:${token}`);
        if (isBlocked) {
            req.user = null;
            return next();
        }

        if (user.subscriptionType === 'premium' && user.subscriptionExpiry && user.subscriptionExpiry <= new Date()) {
            user.subscriptionType = 'free';
            await user.save();
        }

        req.user = user;
        next();
    } catch (err) {
        req.user = null;
        next();
    }
};
