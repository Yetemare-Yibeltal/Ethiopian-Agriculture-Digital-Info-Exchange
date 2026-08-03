// backend/src/middleware/logger.js
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name (ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create write streams for different log files
const accessLogStream = fs.createWriteStream(path.join(logDir, "access.log"), {
  flags: "a",
});

const errorLogStream = fs.createWriteStream(path.join(logDir, "errors.log"), {
  flags: "a",
});

/**
 * Custom Morgan token to log request body
 */
morgan.token("body", (req) => {
  if (req.body && Object.keys(req.body).length > 0) {
    // Don't log passwords or sensitive data
    const sanitized = { ...req.body };
    if (sanitized.password) sanitized.password = "***";
    if (sanitized.confirmPassword) sanitized.confirmPassword = "***";
    if (sanitized.currentPassword) sanitized.currentPassword = "***";
    if (sanitized.newPassword) sanitized.newPassword = "***";
    return JSON.stringify(sanitized);
  }
  return "-";
});

/**
 * Custom Morgan token to log user ID if authenticated
 */
morgan.token("userId", (req) => {
  if (req.profile && req.profile.id) {
    return req.profile.id.substring(0, 8);
  }
  return "-";
});

/**
 * Custom Morgan token to log user role if authenticated
 */
morgan.token("userRole", (req) => {
  if (req.profile && req.profile.role) {
    return req.profile.role;
  }
  return "-";
});

/**
 * Custom Morgan token to log response time in milliseconds with color
 */
morgan.token("responseTimeColor", (req, res, tokens) => {
  const time = tokens["response-time"](req, res);
  if (!time) return "-";
  const ms = parseInt(time);
  if (ms < 100) return `\x1b[32m${time}ms\x1b[0m`; // Green
  if (ms < 500) return `\x1b[33m${time}ms\x1b[0m`; // Yellow
  return `\x1b[31m${time}ms\x1b[0m`; // Red
});

/**
 * Custom Morgan token to log status code with color
 */
morgan.token("statusColor", (req, res, tokens) => {
  const status = tokens.status(req, res);
  if (!status) return "-";
  const code = parseInt(status);
  if (code < 300) return `\x1b[32m${status}\x1b[0m`; // Green
  if (code < 400) return `\x1b[33m${status}\x1b[0m`; // Yellow
  if (code < 500) return `\x1b[35m${status}\x1b[0m`; // Magenta
  return `\x1b[31m${status}\x1b[0m`; // Red
});

/**
 * Development format: Detailed, colorized output for console
 */
const devFormat = `
┌─────────────────────────────────────────────────────
│ ${"\x1b[36m"}:method :url${"\x1b[0m"}
│ Status: :statusColor
│ Time:   :responseTimeColor
│ Size:   :res[content-length] bytes
│ User:   :userId (:userRole)
│ IP:     :remote-addr
│ Agent:  :user-agent
└─────────────────────────────────────────────────────
`;

/**
 * Production format: JSON format for log files
 */
const prodFormat = JSON.stringify({
  timestamp: ":date[iso]",
  method: ":method",
  url: ":url",
  status: ":status",
  responseTime: ":response-time",
  contentLength: ":res[content-length]",
  userId: ":userId",
  userRole: ":userRole",
  ip: ":remote-addr",
  userAgent: ":user-agent",
  referrer: ":referrer",
  body: ":body",
});

/**
 * Combined format for file logging (single line)
 */
const combinedFormat =
  ':remote-addr - :userId (:userRole) [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

/**
 * Console logger (development)
 */
export const consoleLogger = morgan(devFormat, {
  skip: (req) => {
    // Skip logging static assets and health checks in development
    if (req.url === "/health" || req.url === "/ping") return true;
    if (req.url.startsWith("/favicon.ico")) return true;
    return false;
  },
});

/**
 * File logger (production)
 */
export const fileLogger = morgan(combinedFormat, {
  stream: accessLogStream,
  skip: (req) => {
    // Skip logging health checks in production
    if (req.url === "/health" || req.url === "/ping") return true;
    if (req.url.startsWith("/favicon.ico")) return true;
    return false;
  },
});

/**
 * Error logger - logs errors to errors.log file
 */
export const errorLogger = morgan(combinedFormat, {
  stream: errorLogStream,
  skip: (req, res) => {
    // Only log errors (status >= 400)
    return res.statusCode < 400;
  },
});

/**
 * Custom logger for application logging
 */
export const appLogger = {
  /**
   * Log an info message
   */
  info: (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: "INFO",
      message,
      data: data || null,
    };
    console.log(`\x1b[36m[INFO]\x1b[0m ${timestamp} - ${message}`);
    if (data) {
      console.log("   Data:", JSON.stringify(data, null, 2));
    }
    // Append to info log file
    try {
      const infoLogStream = fs.createWriteStream(path.join(logDir, "app.log"), {
        flags: "a",
      });
      infoLogStream.write(JSON.stringify(logEntry) + "\n");
      infoLogStream.end();
    } catch (error) {
      // Silently fail if log file can't be written
    }
  },

  /**
   * Log a warning message
   */
  warn: (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: "WARN",
      message,
      data: data || null,
    };
    console.log(`\x1b[33m[WARN]\x1b[0m ${timestamp} - ${message}`);
    if (data) {
      console.log("   Data:", JSON.stringify(data, null, 2));
    }
    try {
      const warnLogStream = fs.createWriteStream(path.join(logDir, "app.log"), {
        flags: "a",
      });
      warnLogStream.write(JSON.stringify(logEntry) + "\n");
      warnLogStream.end();
    } catch (error) {
      // Silently fail
    }
  },

  /**
   * Log an error message
   */
  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: "ERROR",
      message,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            code: error.code,
          }
        : null,
    };
    console.log(`\x1b[31m[ERROR]\x1b[0m ${timestamp} - ${message}`);
    if (error) {
      console.log("   Error:", error.message);
      if (error.stack) {
        console.log("   Stack:", error.stack);
      }
    }
    try {
      const errorLogStream = fs.createWriteStream(
        path.join(logDir, "app.log"),
        { flags: "a" },
      );
      errorLogStream.write(JSON.stringify(logEntry) + "\n");
      errorLogStream.end();
    } catch (e) {
      // Silently fail
    }
  },

  /**
   * Log debug message (only in development)
   */
  debug: (message, data = null) => {
    if (process.env.NODE_ENV !== "development") return;
    const timestamp = new Date().toISOString();
    console.log(`\x1b[90m[DEBUG]\x1b[0m ${timestamp} - ${message}`);
    if (data) {
      console.log("   Data:", JSON.stringify(data, null, 2));
    }
  },

  /**
   * Log an API request
   */
  request: (req, res, responseTime) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type: "REQUEST",
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"] || "-",
      userId: req.profile?.id || "-",
      userRole: req.profile?.role || "-",
    };
    // Log to console
    const color = res.statusCode < 400 ? "\x1b[32m" : "\x1b[31m";
    console.log(
      `${color}[${logEntry.method}] ${logEntry.url} - ${logEntry.status} (${logEntry.responseTime})\x1b[0m`,
    );
    // Append to request log file
    try {
      const reqLogStream = fs.createWriteStream(
        path.join(logDir, "requests.log"),
        { flags: "a" },
      );
      reqLogStream.write(JSON.stringify(logEntry) + "\n");
      reqLogStream.end();
    } catch (error) {
      // Silently fail
    }
  },
};

/**
 * Combined logger middleware for production
 */
export const productionLogger = (req, res, next) => {
  const start = Date.now();
  // Use file logger for all requests
  fileLogger(req, res, (err) => {
    if (err) {
      // If there's an error, log it
      appLogger.error("File logger error:", err);
    }
    // Log the request
    const responseTime = Date.now() - start;
    appLogger.request(req, res, responseTime);
    next();
  });
};

/**
 * Development logger middleware (combines console and minimal file logging)
 */
export const developmentLogger = (req, res, next) => {
  const start = Date.now();
  // Use console logger
  consoleLogger(req, res, (err) => {
    if (err) {
      appLogger.error("Console logger error:", err);
    }
    const responseTime = Date.now() - start;
    // Also log to app logger
    appLogger.debug(
      `${req.method} ${req.url} - ${res.statusCode} (${responseTime}ms)`,
    );
    next();
  });
};

/**
 * Get the appropriate logger based on environment
 */
export const getLogger = () => {
  if (process.env.NODE_ENV === "production") {
    return productionLogger;
  }
  return developmentLogger;
};

/**
 * Middleware to log request and response details
 */
export const requestLogger = (req, res, next) => {
  // Store the original send function
  const originalSend = res.send;
  let responseBody = null;

  // Override send to capture response body
  res.send = function (body) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  const start = Date.now();

  // Log when response is finished
  res.on("finish", () => {
    const responseTime = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userId: req.profile?.id || "-",
      userRole: req.profile?.role || "-",
      userAgent: req.headers["user-agent"] || "-",
    };

    // Log to console with color
    const color = res.statusCode < 400 ? "\x1b[32m" : "\x1b[31m";
    console.log(
      `${color}[${logData.method}] ${logData.url} - ${logData.status} (${logData.responseTime})\x1b[0m`,
    );

    // Log errors to error log
    if (res.statusCode >= 400) {
      const errorLog = {
        ...logData,
        timestamp: new Date().toISOString(),
        responseBody: responseBody,
        level: res.statusCode >= 500 ? "ERROR" : "WARN",
      };
      try {
        const errLogStream = fs.createWriteStream(
          path.join(logDir, "errors.log"),
          { flags: "a" },
        );
        errLogStream.write(JSON.stringify(errorLog) + "\n");
        errLogStream.end();
      } catch (e) {
        // Silently fail
      }
    }
  });

  next();
};

export default {
  consoleLogger,
  fileLogger,
  errorLogger,
  appLogger,
  productionLogger,
  developmentLogger,
  getLogger,
  requestLogger,
};
