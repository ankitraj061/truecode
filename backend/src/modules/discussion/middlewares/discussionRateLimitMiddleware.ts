import type { Request, Response, NextFunction } from "express";
import { redisClient } from "../../../config/redis.js";

export const discussionRateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;
        const redisKey = `discussion_limit:${userId}`;

        // Get current discussion count as string, default to '0'
        const currentCount = (await redisClient.get(redisKey)) || '0';
        const maxDiscussions = req.user.subscriptionType === 'premium' ? 20 : 5;

        const countAsNumber = parseInt(currentCount);

        if (countAsNumber >= maxDiscussions) {
            return res.status(429).json({
                error: `Discussion limit reached. You can create ${maxDiscussions} discussions per hour.`,
                action: 'rate_limit_exceeded',
                remainingTime: await redisClient.ttl(redisKey) // Time until reset
            });
        }

        // Increment counter - always pass string to Redis
        // NOTE: redisClient is the @upstash/redis SDK — lowercase `setex`,
        // not node-redis's camelCase `setEx` (which silently doesn't exist
        // here and previously made this limiter a no-op).
        const newCount = String(countAsNumber + 1);
        await redisClient.setex(redisKey, 3600, newCount); // 1 hour expiry

        next();
    } catch (error) {
        // Don't block the request if rate limiting fails
        next();
    }
};
