const logger = require("../utils/logger");

// Middleware to check if a user is authenticated
exports.isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    logger.info(`User ID: ${req.session.userId} authenticated successfully.`);
    return next();
  }
  logger.warn(`Unauthorized access attempt to: ${req.originalUrl}`);
  res.redirect("/login");
};

// Middleware to check if a user is an admin
exports.isAdmin = (req, res, next) => {
  if (req.session.role === "admin") {
    logger.info(`Admin access granted for user ID: ${req.session.userId}`);
    return next();
  }
  logger.warn(
    `Access denied for non-admin user ID: ${req.session.userId} to route: ${req.originalUrl}`
  );
  res.status(403).send("Access Denied: Admins only");
};
