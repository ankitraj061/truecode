// redis.js - FIXED & CLEAN
import { createClient } from "redis";
import { Redis } from "@upstash/redis";
import dotenv from "dotenv";
dotenv.config();

const useUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

const client = useUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : createClient({
      username: "default",
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        tls: {},
        connectTimeout: 15000,
        keepAlive: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            return false;
          }
          const delay = Math.min(retries * 500, 2000);
          return delay;
        },
      },
    });

if (!useUpstash) {
  client.on("error", () => {});
  client.on("connect", () => {});
  client.on("ready", () => {});
  client.on("end", () => {});
}

let connectionAttempted = false;

export const connectRedis = async () => {
  if (connectionAttempted) return;
  connectionAttempted = true;

  try {
    if (useUpstash) {
      await client.ping();
    } else {
      await client.connect();
    }
  } catch (err) {
    throw err;
  }
};

setTimeout(connectRedis, 100);

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
