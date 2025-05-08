require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { createClient } = require("redis");


const path = require("path");
const { connectToDB } = require("./database/db");
const User = require("./models/User");
const bcrypt = require('bcryptjs');

// Server initialization
const app = express();



// Database connection
connectToDB();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "http://localhost:5001", "data:"],  // ✅ allow image loading from backend
      mediaSrc: ["'self'", "http://localhost:5001"],          // optional: for video/audio
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },       // ✅ allow cross-origin resource loading
  hsts: {
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true
  }
}));


// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later'
});

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL
});



// General middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("combined"));

// CORS configuration
app.use(cors({
  origin: process.env.ORIGIN,
  credentials: true,
  exposedHeaders: ['X-Total-Count', 'Set-Cookie'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', ]
}));



// Static files
app.use("/assets/uploads", express.static(path.join(__dirname, "assets/uploads")));

// Routes
app.use("/auth", authLimiter, require("./routes/Auth"));
app.use("/users", require("./routes/User"));
app.use("/products", require("./routes/Product"));
app.use("/orders", require("./routes/Order"));
app.use("/cart", require("./routes/Cart"));
app.use("/brands", require("./routes/Brand"));
app.use("/address", require("./routes/Address"));
app.use("/upload", require("./routes/Upload"));

// Admin initialization
async function createInitialAdmin() {
  try {
    const adminExists = await User.findOne({ isAdmin: true });
    if (!adminExists && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
      await User.create({
        name: process.env.ADMIN_USERNAME || 'Admin',
        email: process.env.ADMIN_EMAIL,
        isAdmin: true,
        password: hashedPassword
      });
      console.log('Initial admin user created');
    }
  } catch (error) {
    console.error('Admin creation error:', error.message);
  }
}

createInitialAdmin();

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test Redis connection
    await redisClient.ping();
    
    res.json({
      status: 'OK',
      db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      redis: 'Connected'
    });
  } catch (err) {
    res.json({
      status: 'Degraded',
      db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      redis: 'Disconnected'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Server startup
const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`
  Server running in ${process.env.NODE_ENV || 'development'} mode
  Listening on port ${port}
  Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connection failed'}
  Redis: ${redisClient.connected ? 'Connected' : 'Connection failed'}
  `);
});

