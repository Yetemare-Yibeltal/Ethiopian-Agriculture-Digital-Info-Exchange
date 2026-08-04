// backend/server.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { createServer } from "http";

// Import custom middleware
import {
  errorHandler,
  notFoundHandler,
  catchAsync,
} from "./src/middleware/errorHandler.js";
import {
  consoleLogger,
  fileLogger,
  appLogger,
} from "./src/middleware/logger.js";
import { authMiddleware } from "./src/middleware/auth.js";
import { apiRateLimiter } from "./src/middleware/rateLimiter.js";

// Import routes
import apiRoutes from "./src/routes/index.js";

// Load environment variables
dotenv.config();

// =============================================
// ENVIRONMENT VALIDATION
// =============================================
const requiredEnvVars = [
  "PORT",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingVars.forEach((varName) => console.error(`   - ${varName}`));
  console.error("Please check your .env file.");
  process.exit(1);
}

// =============================================
// CONFIGURATION
// =============================================
const PORT = parseInt(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";
const isDevelopment = NODE_ENV === "development";

// =============================================
// INITIALIZE EXPRESS APP
// =============================================
const app = express();
const server = createServer(app);

// =============================================
// LOGGING
// =============================================
// Use console logger in development, file logger in production
if (isDevelopment) {
  app.use(consoleLogger);
} else {
  app.use(fileLogger);
}

// Log server start
appLogger.info(`🚀 Starting EADE API Server in ${NODE_ENV} mode`);

// =============================================
// SECURITY MIDDLEWARE
// =============================================

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  maxAge: 86400, // 24 hours
};
app.use(cors(corsOptions));

// Helmet for security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: true,
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: true,
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  }),
);

// =============================================
// REQUEST PARSING
// =============================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// =============================================
// GLOBAL RATE LIMITING (Apply to all routes)
// =============================================
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 200 : 1000, // stricter in production
  message: {
    status: "error",
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    if (req.profile && req.profile.id) {
      return `user:${req.profile.id}`;
    }
    return req.ip || req.connection.remoteAddress;
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    if (req.path === "/health" || req.path === "/") {
      return true;
    }
    return false;
  },
});

app.use(globalRateLimiter);

// =============================================
// MOUNT API ROUTES
// =============================================
app.use("/api", apiRoutes);

// =============================================
// HEALTH CHECK ENDPOINT (already in routes)
// =============================================
// Additional health check at root
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "EADE API is running",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime(),
  });
});

// Root welcome
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to EADE API - Ethiopian Agricultural Digital Exchange",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    documentation: "/api",
  });
});

// =============================================
// ERROR HANDLING
// =============================================

// 404 handler for routes that don't exist
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// =============================================
// START SERVER
// =============================================
const startServer = () => {
  server.listen(PORT, () => {
    console.log("========================================");
    console.log("✅ EADE API Server Started Successfully");
    console.log("========================================");
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`📊 API Documentation: http://localhost:${PORT}/api`);
    console.log(`💚 Health Check: http://localhost:${PORT}/health`);
    console.log("========================================");
    console.log("📦 Available Endpoints:");
    console.log(`   /api/auth        - Authentication routes`);
    console.log(`   /api/listings    - Listing management routes`);
    console.log(`   /api/offers      - Offer management routes`);
    console.log(`   /api/farmers     - Farmer management routes`);
    console.log(`   /api/search      - Search and discovery routes`);
    console.log(`   /api/admin       - Admin management routes`);
    console.log("========================================");
  });
};

// =============================================
// GRACEFUL SHUTDOWN
// =============================================
const gracefulShutdown = () => {
  console.log("🛑 Received shutdown signal, closing server gracefully...");

  server.close(() => {
    console.log("✅ Server closed successfully");
    process.exit(0);
  });

  // Force close after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error("⚠️ Force closing server after timeout");
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// =============================================
// UNCAUGHT EXCEPTION HANDLING
// =============================================
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:");
  console.error(error);
  appLogger.error("Uncaught Exception", error);
  // Gracefully shut down
  gracefulShutdown();
});

// =============================================
// UNHANDLED REJECTION HANDLING
// =============================================
process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise);
  console.error("💥 Reason:", reason);
  appLogger.error("Unhandled Rejection", reason);
  // Gracefully shut down
  gracefulShutdown();
});

// =============================================
// START THE SERVER
// =============================================
startServer();

// Export app for testing purposes
export default app;
