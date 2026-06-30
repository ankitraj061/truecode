import type { Request, Response, NextFunction } from "express";
import { redisClient } from "../../../config/redis.js";

const submitCodeWaitingTimeMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const redisKey = `submit_cooldown:${userId}`;

    // check if cooldown exists
    const exists = await redisClient.exists(redisKey);
    if (exists) {
      return res
        .status(429)
        .json({ error: "Please wait 10 seconds before submitting again." });
    }

    // set cooldown period (10 seconds)
    // NOTE: redisClient is the @upstash/redis SDK, which needs lowercase
    // `ex`/`nx` option keys. Uppercase `EX`/`NX` are silently ignored by
    // this SDK, so the key was previously set with NO expiry at all —
    // meaning every user got permanently locked out after their first
    // submission. This was a live, undetected production bug.
    await redisClient.set(redisKey, "cooldown_active", {
      ex: 10, // expiry 10 seconds
      nx: true, // only set if not already exists
    });

    next();
  } catch (error) {
    next();
  }
};

// Shorter cooldown for "Run Code" — hit far more often than submit,
// but still needs a floor to stop spamming the local compiler + Judge0.
export const runCodeWaitingTimeMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const redisKey = `run_cooldown:${userId}`;

    const exists = await redisClient.exists(redisKey);
    if (exists) {
      return res
        .status(429)
        .json({ error: "Please wait 5 seconds before running again." });
    }

    await redisClient.set(redisKey, "cooldown_active", {
      ex: 5,
      nx: true,
    });

    next();
  } catch (error) {
    next();
  }
};

export default submitCodeWaitingTimeMiddleware;
