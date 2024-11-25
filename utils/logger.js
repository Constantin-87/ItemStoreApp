const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");

class Logger {
  constructor() {
    if (Logger.instance) {
      return Logger.instance; // Return the existing instance if already created
    }

    Logger.instance = this;

    // Daily Rotate File Transport for error logs
    const errorFileTransport = new transports.DailyRotateFile({
      filename: "logs/error-%DATE%.log", // Rotated file pattern
      datePattern: "YYYY-MM-DD", // Rotate logs daily
      maxSize: "20m", // Maximum file size before rotation
      maxFiles: "14d", // Keep logs for the last 14 days
      level: "error", // Only log errors
    });

    // Daily Rotate File Transport for combined logs
    const combinedFileTransport = new transports.DailyRotateFile({
      filename: "logs/combined-%DATE%.log", // Rotated file pattern
      datePattern: "YYYY-MM-DD", // Rotate logs daily
      maxSize: "20m", // Maximum file size before rotation
      maxFiles: "14d", // Keep logs for the last 14 days
    });

    // Initialize Winston logger
    this.logger = createLogger({
      level: "info", // Default logging level
      format: format.combine(
        format.timestamp(),
        format.json() // Log in JSON format for structured storage
      ),
      transports: [
        errorFileTransport, // Daily rotated error logs
        combinedFileTransport, // Daily rotated combined logs
      ],
    });

    // Add console logging for development
    if (process.env.NODE_ENV !== "production") {
      this.logger.add(
        new transports.Console({
          format: format.combine(format.colorize(), format.simple()),
        })
      );
    }
  }

  log(level, message) {
    this.logger.log({ level, message });
  }

  info(message) {
    this.log("info", message);
  }

  warn(message) {
    this.log("warn", message);
  }

  error(message) {
    this.log("error", message);
  }
}

const singletonLogger = new Logger(); // Ensure a single instance
Object.freeze(singletonLogger); // Make immutable
module.exports = singletonLogger;
