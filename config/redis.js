const { createClient } = require('redis');

const redisClient = createClient({
  // url: process.env.REDIS_URL,
      username: 'default',
    password: 'IxkzSaurShunr5is1aWhd8lzOY0g59Gp',
    socket: {
        host: 'redis-15892.c330.asia-south1-1.gce.redns.redis-cloud.com',
        port: 15892
    }

});

redisClient.on('connect', () => console.log('🔁 Connecting to Redis...'));
redisClient.on('ready', () => console.log('✅ Redis ready'));
redisClient.on('reconnecting', () => console.log('🔁 Redis reconnecting'));
redisClient.on('end', () => console.log('❌ Redis disconnected'));
redisClient.on('error', (err) => console.error('Redis error:', err));

(async () => {
  try {
    await redisClient.connect();
    console.log('✅ Redis connected');
  } catch (err) {
    console.error('❌ Redis connection failed:', err);
  }
})();

module.exports = redisClient;
