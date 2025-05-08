const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXP = '15m',  // Default 15 minutes
  REFRESH_TOKEN_EXP = '7d'   // Default 7 days
} = process.env;

const generateAccessToken = (user, sessionId) => {
  if (!user?._id || !sessionId) {
    throw new Error('Missing required fields for access token generation');
  }

  return jwt.sign(
    {
      userId: user._id.toString(),
      sessionId,
      isAdmin: user.isAdmin || false,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXP }
  );
};

const generateRefreshToken = (user, sessionId) => {
  if (!user?._id || !sessionId) {
    throw new Error('Missing required fields for refresh token generation');
  }

  return jwt.sign(
    {
      userId: user._id.toString(),
      sessionId,
     
    },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXP }
  );
};

const generatePasswordResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour
  
  return {
    token,
    expiresAt: expiresAt.toISOString(),
    hash: crypto.createHash("sha256").update(token).digest("hex")
  };
};

// Token verification utilities
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET);
  } catch (err) {
    console.error("Access token verification error:", err);
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (err) {
    console.error("Refresh token verification error:", err);
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generatePasswordResetToken,
  verifyAccessToken,
  verifyRefreshToken
};