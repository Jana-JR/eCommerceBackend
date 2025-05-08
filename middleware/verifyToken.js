const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');

exports.verifyToken = async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Authorization required" });

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (!decoded?.userId) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // Verify session exists in Redis
    const sessionKey = `user:${decoded.userId}:session:${decoded.sessionId}`;
    const exists = await redisClient.exists(sessionKey);
    if (!exists) return res.status(401).json({ error: "Session expired" });

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      sessionId: decoded.sessionId,
      isAdmin: decoded.isAdmin || false
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    // Specific error messages
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Session expired - please login again" });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    return res.status(401).json({ error: "Authentication failed" });
  }
};