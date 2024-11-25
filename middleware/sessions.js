const logger = require("../utils/logger");

exports.handleSessionTimeout = (req, res, next) => {
  if (req.session.userId) {
    // If `lastActivity` is not set, initialize it
    if (!req.session.lastActivity) {
      req.session.lastActivity = Date.now();
      logger.info(
        `Session activity initialized for user ID: ${req.session.userId}`
      );
    }

    // Check if the session has been idle for longer than `maxAge`
    const sessionTimeout = req.session.cookie.maxAge;
    if (Date.now() - req.session.lastActivity > sessionTimeout) {
      logger.warn(`Session timed out for user ID: ${req.session.userId}`);
      const message = "Session expired. Please log in again.";
      req.session.destroy((err) => {
        if (err) {
          logger.error(
            `Error destroying session for user ID ${req.session.userId}: ${err.message}`
          );
        }
        res.redirect(`/login?message=${encodeURIComponent(message)}`);
      });
      return;
    }

    // Update lastActivity to track current activity
    req.session.lastActivity = Date.now();
    logger.info(`Session activity updated for user ID: ${req.session.userId}`);
  } else {
    logger.warn(`Session timeout check performed for unauthenticated user.`);
  }
  next();
};
