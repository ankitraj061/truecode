import { redisClient } from "../config/redis.js";

export const ipRateLimitMiddleware = async (req, res, next) => {
    try {
        const clientIP = req.ip || req.connection.remoteAddress || '127.0.0.1';
        const redisKey = `ip_limit:${clientIP}`;
        const maxRequests = 1000;

        const count = await redisClient.incr(redisKey);
        if (count === 1) {
            await redisClient.expire(redisKey, 3600);
        }

        if (count > maxRequests) {
            return res.status(429).json({ 
                error: 'Too many requests from this IP. Please try again later.',
                action: 'ip_rate_limit_exceeded'
            });
        }

        next();
    } catch (error) {
        next();
    }
};




// Protection Against
// DDoS attacks - Prevents server overload from flood requests

// Brute force attacks - Stops password cracking attempts

// API abuse - Prevents scraping and excessive usage

// Resource exhaustion - Protects database and server resources

// Bot traffic - Blocks automated spam and scraping



// Without rate limiting
// Attacker sends 10,000 requests per second → Server crashes

// With rate limiting  
// Attacker sends 10,000 requests → Only first 1000 allowed per hour
// Server stays stable and legitimate users can still access




// simple sliding window rate limiter - 60 requests per hour
const rateLimit = async (req, res, next) => {
  const key = `rate:${req.ip}`;
  const now = Date.now();
  const windowMs = 3600 * 1000;
  const windowStart = now - windowMs;
  const maxRequests = 60;

  try {
    await redisClient.zRemRangeByScore(key, 0, windowStart);

    const count = await redisClient.zCard(key);

    if (count >= maxRequests) {
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
        action: "rate_limit_exceeded",
      });
    }

    await redisClient.zAdd(key, [
      { score: now, value: Math.random().toString() }
    ]);

    await redisClient.expire(key, 3600);

    next();
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// Simple cooldown mechanism - 1 request every 10 seconds
const rateLimitfor10sec = async (req, res, next) => {
  const key = `lastreq:${req.ip}`;
  const cooldown = 10; // seconds
  const now = Math.floor(Date.now() / 1000);

  try {
    const lastRequest = await redisClient.get(key);

    if (lastRequest && now - lastRequest < cooldown) {
      const wait = cooldown - (now - lastRequest);
      return res.status(429).json({
        error: `Please wait ${wait}s before trying again.`,
        action: "cooldown_active"
      });
    }

    // store timestamp + auto-expire
    await redisClient.set(key, now, { EX: cooldown });

    next();
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
