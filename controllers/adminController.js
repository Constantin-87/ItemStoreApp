const db = require("../database");
const logger = require("../utils/logger");

// Fetch all users
exports.getUsers = (req, res) => {
  db.all(
    "SELECT id, username, email, role, is_locked FROM users",
    (err, users) => {
      if (err) {
        logger.error(`Failed to fetch users: ${err.stack || err.message}`);
        return res
          .status(500)
          .send("An unexpected error occurred. Please try again later.");
      }
      logger.info("Fetched all users for admin panel successfully.");
      res.render("admin", { users });
    }
  );
};

// Delete user
exports.deleteUser = (req, res) => {
  const userId = req.params.id;
  db.run("DELETE FROM users WHERE id = ?", [userId], (err) => {
    if (err) {
      logger.error(
        `Failed to delete user with ID ${userId}: ${err.stack || err.message}`
      );
      return res
        .status(500)
        .send("An unexpected error occurred. Please try again later.");
    }
    logger.info(`Deleted user with ID ${userId} successfully.`);
    res.redirect("/admin");
  });
};

// Lock/Unlock user
exports.toggleLock = (req, res) => {
  const userId = req.params.id;
  db.get("SELECT is_locked FROM users WHERE id = ?", [userId], (err, user) => {
    if (err) {
      logger.error(
        `Failed to fetch user with ID ${userId} for lock/unlock: ${
          err.stack || err.message
        }`
      );
      return res
        .status(500)
        .send("An unexpected error occurred. Please try again later.");
    }

    if (!user) {
      logger.warn(`Attempt to toggle lock for non-existent user ID: ${userId}`);
      return res.status(404).send("User not found");
    }

    const newLockStatus = user.is_locked ? 0 : 1;

    db.run(
      "UPDATE users SET is_locked = ? WHERE id = ?",
      [newLockStatus, userId],
      (err) => {
        if (err) {
          logger.error(
            `Failed to update lock status for user ID ${userId}: ${
              err.stack || err.message
            }`
          );
          return res
            .status(500)
            .send("An unexpected error occurred. Please try again later.");
        }
        const action = newLockStatus ? "locked" : "unlocked";
        logger.info(`User ID: ${userId} has been ${action} successfully.`);
        res.redirect("/admin");
      }
    );
  });
};
