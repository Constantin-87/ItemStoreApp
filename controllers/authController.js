const db = require("../database");

exports.getLogin = (req, res) => {
  res.render("login");
};

exports.postLogin = (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) {
      // Sensitive data exposure
      return res.status(500).send(`Database Error: ${err.message}`);
    }

    if (user) {
      if (user.is_locked) {
        return res
          .status(403)
          .send("Account is locked. Please contact an administrator.");
      }

      if (user && user.password === password) {
        // Reset failed attempts on successful login
        db.run("UPDATE users SET failed_attempts = 0 WHERE email = ?", [email]);
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        return res.redirect("/items");
      } else {
        // Increment failed attempts if password is incorrect
        const newAttempts = user.failed_attempts + 1;

        if (newAttempts >= 5) {
          // Lock the account after 5 failed attempts
          db.run(
            "UPDATE users SET is_locked = 1, failed_attempts = ? WHERE email = ?",
            [newAttempts, email]
          );
          return res
            .status(403)
            .send("Account is locked due to too many failed attempts.");
        } else {
          // Update failed attempts count
          db.run("UPDATE users SET failed_attempts = ? WHERE email = ?", [
            newAttempts,
            email,
          ]);
          return res.status(401).send("Unauthorized: Incorrect password.");
        }
      }
    } else {
      return res.status(401).send("Unauthorized: Email not found.");
    }
  });
};

exports.getRegister = (req, res) => {
  res.render("register");
};

exports.postRegister = (req, res) => {
  const { email, username, password } = req.body;

  // Default values for new users
  const role = "user"; // Assign default role as 'user'
  const locked = 0; // Account is not locked by default

  // Insert the new user into the database
  const insertQuery = `INSERT INTO users (email, username, password, role, is_locked) 
                       VALUES ('${email}', '${username}', '${password}', '${role}', ${locked})`;

  // Insecure: Storing passwords in plain text (no hashing)
  db.run(insertQuery, (err) => {
    if (err) {
      // Expose sensitive database error details to the user
      return res.status(500).send(`Database Error: ${err.message}`);
    }
    // If registration is successful, automatically log in the user
    db.get(
      "SELECT * FROM users WHERE username = ?",
      [username],
      (err, user) => {
        if (err) {
          // Expose sensitive database error details to the user during login
          return res.status(500).send(`Database Error: ${err.message}`);
        }
        if (user) {
          req.session.userId = user.id;
          req.session.username = user.username;
          req.session.role = user.role;
          return res.redirect("/items");
        }
        res.redirect("/login");
      }
    );
  });
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};
