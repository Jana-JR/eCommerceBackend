const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redisClient = require('./redis');

// Ensure Redis client is connected
redisClient.connect().catch(console.error);

const store = new RedisStore({
  client: redisClient,
  prefix: "user_sess:", // Changed to match token validation
  ttl: 86400 // 1 day in seconds
});

module.exports = session({
  store,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'auth_token', // Simpler name
  cookie: {
    secure: process.env.PRODUCTION === 'true',
    httpOnly: true,
    sameSite: process.env.PRODUCTION === 'true' ? 'none' : 'lax',
    domain: process.env.COOKIE_DOMAIN || 'localhost',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  },
  // Add these for better session handling
  rolling: true, // Renew cookie on access
  unset: 'destroy' // Destroy session when unset
});