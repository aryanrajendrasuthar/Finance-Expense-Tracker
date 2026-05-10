const Redis = require('ioredis');

let redis = null;

try {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    retryStrategy: (times) => {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
  });

  redis.on('error', (err) => {
    console.warn('[Redis] Connection error (caching disabled):', err.message);
  });
} catch (err) {
  console.warn('[Redis] Failed to initialize (caching disabled):', err.message);
}

const cacheGet = async (key) => {
  if (!redis) return null;
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

const cacheSet = async (key, value, ttlSeconds = 600) => {
  if (!redis) return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {}
};

const cacheDel = async (...keys) => {
  if (!redis) return;
  try {
    await redis.del(...keys);
  } catch {}
};

const cacheDelPattern = async (pattern) => {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch {}
};

module.exports = { redis, cacheGet, cacheSet, cacheDel, cacheDelPattern };
