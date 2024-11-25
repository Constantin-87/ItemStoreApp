const logger = require("../utils/logger");

// Middleware to check if a user is authenticated
exports.isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    logger.info(`User ID: ${req.session.userId} authenticated successfully.`);
    return next();
  }
  logger.warn(
    `Unauthorized access attempt to: ${req.originalUrl} from IP: ${req.ip}`
  );
  const message = "Unauthorized access. Please log in.";
  res.redirect(`/login?errorMessage=${encodeURIComponent(message)}`);
};

// Middleware to check if a user is an admin
exports.isAdmin = (req, res, next) => {
  if (req.session.role === "admin") {
    logger.info(`Admin access granted for user ID: ${req.session.userId}`);
    return next();
  }
  logger.warn(
    `Access denied for non-admin user ID: ${req.session.userId} to route: ${req.originalUrl} from IP: ${req.ip}`
  );
  const message = "Access Denied: Admins only.";
  res.redirect(`/login?errorMessage=${encodeURIComponent(message)}`);
};
