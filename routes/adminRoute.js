const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const db = require("../database");

// Admin route to view all users
router.get("/", isAuthenticated, isAdmin, (req, res) => {
  db.all(
    "SELECT id, username, email, role, is_locked FROM users",
    (err, users) => {
      if (err) {
        return res.status(500).send("Database Error: " + err.message);
      }
      res.render("admin", { users });
    }
  );
});

// Route to delete a user
router.post("/delete/:id", isAuthenticated, isAdmin, (req, res) => {
  const userId = req.params.id;
  db.run("DELETE FROM users WHERE id = ?", [userId], (err) => {
    if (err) {
      return res.status(500).send("Database Error: " + err.message);
    }
    res.redirect("/admin");
  });
});

// Route to lock/unlock a user account
router.post("/toggle-lock/:id", isAuthenticated, isAdmin, (req, res) => {
  const userId = req.params.id;
  db.get("SELECT is_locked FROM users WHERE id = ?", [userId], (err, user) => {
    if (err || !user) {
      return res.status(500).send("Database Error: " + err.message);
    }
    const newLockStatus = user.is_locked ? 0 : 1;
    db.run(
      "UPDATE users SET is_locked = ? WHERE id = ?",
      [newLockStatus, userId],
      (err) => {
        if (err) {
          return res.status(500).send("Database Error: " + err.message);
        }
        res.redirect("/admin");
      }
    );
  });
});

module.exports = router;
