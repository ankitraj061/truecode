// redis.js - FIXED & CLEAN
import { createClient } from "redis";
import { Redis } from "@upstash/redis";
import dotenv from "dotenv";
dotenv.config();

const useUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

const redisConfig = {
  username: "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT || 6379),
    tls: true,
    connectTimeout: 15000,
    keepAlive: 5000,
    reconnectStrategy: (retries: number) => {
      if (retries > 3) {
        return false;
      }
      const delay = Math.min(retries * 500, 2000);
      return delay;
    },
  },
};

// NOTE: typed as `any` deliberately — the two possible backends
// (@upstash/redis REST client vs node-redis) expose different method
// casing (lowercase zadd/setex vs camelCase zAdd/setEx), and the whole
// app is written against whichever one is actually configured via env
// vars (currently always Upstash). See ipRateLimitMiddleware.ts /
// discussionRateLimitMiddleware.ts for the history here.
const client: any = useUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : createClient(redisConfig as any);

if (!useUpstash) {
  client.on("error", () => {});
  client.on("connect", () => {});
  client.on("ready", () => {});
  client.on("end", () => {});
}

let connectionAttempted = false;

export const connectRedis = async (): Promise<void> => {
  if (connectionAttempted) return;
  connectionAttempted = true;

  try {
    if (!process.env.REDIS_HOST && !process.env.UPSTASH_REDIS_REST_URL) {
      console.warn('Redis configuration is not available; continuing without cache');
      return;
    }

    if (useUpstash) {
      await client.ping();
    } else {
      await client.connect();
    }
  } catch (err: any) {
    console.warn('Redis unavailable, continuing without cache:', err.message);
  }
};

setTimeout(() => {
  connectRedis().catch((err) => {
    console.warn('Redis initialization failed:', err.message);
  });
}, 100);

const shutdown = async () => {
  try {
    if (!useUpstash && client.isOpen) await client.quit();
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export const redisClient = client;
