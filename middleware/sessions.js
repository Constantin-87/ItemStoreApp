exports.handleSessionTimeout = (req, res, next) => {
  if (req.session.userId) {
    // If `lastActivity` is not set, initialize it
    if (!req.session.lastActivity) {
      req.session.lastActivity = Date.now();
    }

    // Check if the session has been idle for longer than `maxAge`
    const sessionTimeout = req.session.cookie.maxAge;
    if (Date.now() - req.session.lastActivity > sessionTimeout) {
      console.log("Session timed out for user:", req.session.userId);
      const message = "Session expired. Please log in again.";
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
        res.redirect(`/login?message=${encodeURIComponent(message)}`);
      });
      return;
    }

    // Update lastActivity to track current activity
    req.session.lastActivity = Date.now();
  }
  next();
};
