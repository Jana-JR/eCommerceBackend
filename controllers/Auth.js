const User = require("../models/User");
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sanitizeUser } = require("../Utils/SanitizeUser");
const { generateAccessToken, generateRefreshToken } = require("../Utils/GenerateToken");
const redisClient = require('../config/redis');

// Configuration
const SESSION_CONFIG = {
  httpOnly: true,
  secure: process.env.PRODUCTION === 'true',
  sameSite: process.env.PRODUCTION === 'true' ? 'None' : 'Lax'
};
const MAX_SESSIONS_PER_USER = 5;

// Helper Functions
const cleanOldSessions = async (userId) => {
  const pattern = `user:${userId}:session:*`;
  const keys = await redisClient.keys(pattern);
  
  if (keys.length >= MAX_SESSIONS_PER_USER) {
    const oldestSessions = keys.slice(0, keys.length - MAX_SESSIONS_PER_USER + 1);
    if (oldestSessions.length) await redisClient.del(oldestSessions);
  }
};

const storeSession = async (userId, sessionId, token) => {
  const key = `user:${userId}:session:${sessionId}`;
  const expiration = (process.env.REFRESH_TOKEN_EXP_DAYS || 7) * 86400;
  await redisClient.setEx(key, expiration, token);
};

// Controller Methods
exports.signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    if (await User.exists({ email })) return res.status(409).json({ error: "User exists" });

    const user = await User.create({
      ...req.body,
      password: await bcrypt.hash(password, 12)
    });

    const sessionId = crypto.randomBytes(16).toString('hex');
    const accessToken = generateAccessToken(user, sessionId);
    const refreshToken = generateRefreshToken(user, sessionId);

    await storeSession(user._id.toString(), sessionId, refreshToken);

    res.cookie('accessToken', accessToken, {
      ...SESSION_CONFIG,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    res.cookie('refreshToken', refreshToken, {
      ...SESSION_CONFIG,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Credentials required" });

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await cleanOldSessions(user._id.toString());
    const sessionId = crypto.randomBytes(16).toString('hex');
    const accessToken = generateAccessToken(user, sessionId);
    const refreshToken = generateRefreshToken(user, sessionId);

    await storeSession(user._id.toString(), sessionId, refreshToken);

    res.cookie('accessToken', accessToken, {
      ...SESSION_CONFIG,
      maxAge: 15 * 60 * 1000
    });
    res.cookie('refreshToken', refreshToken, {
      ...SESSION_CONFIG,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ user: sanitizeUser(user) ,
      isAdmin: user.isAdmin 
    });
    
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Login failed" });
  }
};

exports.logout = async (req, res) => {
  try {
    if (req.user?.userId && req.user?.sessionId) {
      await redisClient.del(`user:${req.user.userId}:session:${req.user.sessionId}`);
    }
    
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: "Logged out" });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: "Logout failed" });
  }
};

exports.checkAuth = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ 
        isAuthenticated: false,
        message: "Not authenticated" 
      });
    }

    const sessionExists = await redisClient.exists(
      `user:${req.user.userId}:session:${req.user.sessionId}`
    );

    if (!sessionExists) {
      return res.status(401).json({
        isAuthenticated: false, 
        message: "Session expired"
      });
    }

    // Fetch user details from DB if you need email
    const user = await User.findById(req.user.userId).select("_id email isAdmin");

    if (!user) {
      return res.status(404).json({ isAuthenticated: false, message: "User not found" });
    }

    // ✅ Flattened response
    res.json({
      isAuthenticated: true,
      userId: user._id.toString(),
      email: user.email,
      isAdmin: user.isAdmin
    });

  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({
      isAuthenticated: false,
      error: "Authentication check failed"
    });
  }
};
