const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;

const initializeRedis = async () => {
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      // Using Upstash Redis (serverless)
      const { Redis: UpstashRedis } = require('@upstash/redis');
      redisClient = new UpstashRedis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      logger.info('Upstash Redis connected');
    } else if (process.env.REDIS_URL) {
      // Using standard Redis
      redisClient = new Redis(process.env.REDIS_URL, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      redisClient.on('connect', () => {
        logger.info('Redis connected');
      });

      redisClient.on('error', (err) => {
        logger.error('Redis connection error:', err);
      });
    } else {
      logger.warn('Redis not configured, caching will be disabled');
      return null;
    }

    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    return null;
  }
};

const getRedisClient = () => {
  return redisClient;
};

// Cache helper functions
const cache = {
  async get(key) {
    if (!redisClient) return null;
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  },

  async set(key, value, expirationInSeconds = 300) {
    if (!redisClient) return false;
    try {
      await redisClient.setex(key, expirationInSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis set error:', error);
      return false;
    }
  },

  async del(key) {
    if (!redisClient) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Redis delete error:', error);
      return false;
    }
  },

  async exists(key) {
    if (!redisClient) return false;
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error);
      return false;
    }
  },
};

module.exports = {
  initializeRedis,
  getRedisClient,
  cache,
};

