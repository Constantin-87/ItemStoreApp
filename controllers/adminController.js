const db = require("../database");

// Get all users
exports.getUsers = (req, res) => {
  db.all(
    "SELECT id, username, role, is_locked FROM users",
    [],
    (err, users) => {
      if (err) return res.status(500).send("Database Error");
      res.render("admin", { users });
    }
  );
};

// Delete user
exports.deleteUser = (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM users WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).send("Database Error");
    res.redirect("/admin/users");
  });
};

// Lock/Unlock user
exports.toggleLock = (req, res) => {
  const { id } = req.params;
  db.get("SELECT is_locked FROM users WHERE id = ?", [id], (err, user) => {
    if (err) return res.status(500).send("Database Error");
    const newStatus = user.is_locked ? 0 : 1;

    // If unlocking the account, reset failed_attempts to 0
    const updateQuery =
      newStatus === 0
        ? "UPDATE users SET is_locked = ?, failed_attempts = 0 WHERE id = ?"
        : "UPDATE users SET is_locked = ? WHERE id = ?";

    db.run(updateQuery, [newStatus, id], (err) => {
      if (err) return res.status(500).send("Database Error");
      res.redirect("/admin/users");
    });
  });
};
