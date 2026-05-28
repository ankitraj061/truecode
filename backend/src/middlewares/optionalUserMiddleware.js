import { redisClient } from "../config/redis.js";
import User from "../models/user.js";
import jwt from "jsonwebtoken";

export const optionalUserMiddleware = async (req, res, next) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            req.user = null;
            return next();
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
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
