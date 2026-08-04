// backend/src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

// Import middleware
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { consoleLogger, fileLogger } from "./middleware/logger.js";
import apiRoutes from "./routes/index.js";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";

// Logging
if (NODE_ENV === "development") {
  app.use(consoleLogger);
} else {
  app.use(fileLogger);
}

// Security
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 200 : 1000,
  message: {
    status: "error",
    message: "Too many requests. Please try again later.",
  },
});
app.use(globalRateLimiter);

// Mount API
app.use("/api", apiRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "EADE API is running",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
