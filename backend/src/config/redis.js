// redis.js - FIXED & CLEAN
import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

const client = createClient({
  username: "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST, // ✅ from .env
    port: Number(process.env.REDIS_PORT),
    tls: {}, // ✅ REQUIRED for Redis Cloud
    connectTimeout: 15000,
    keepAlive: 5000,
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        return false;
      }
      const delay = Math.min(retries * 500, 2000);
      return delay;
    }
  }
});

// ---- Event listeners ----
client.on("error", () => {});

client.on("connect", () => {});

client.on("ready", () => {});

client.on("end", () => {});

// ---- Connection control ----
let connectionAttempted = false;

export const connectRedis = async () => {
  if (connectionAttempted) return;
  connectionAttempted = true;

  try {
    await client.connect();
  } catch (err) {
  }
};

// Delay connection
setTimeout(connectRedis, 100);

// Graceful shutdown
const shutdown = async () => {
  try {
    if (client.isOpen) await client.quit();
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export const redisClient = client;
