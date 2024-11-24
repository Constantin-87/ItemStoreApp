const db = require("../database");
const validator = require("validator");
const bcrypt = require("bcrypt");

exports.getLogin = (req, res) => {
  res.render("login");
};

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!validator.isEmail(email) || validator.isEmpty(password)) {
    return res.status(400).send("Invalid input.");
  }

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
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

      try {
        // Verify the password
        const match = await bcrypt.compare(password, user.password);
        if (match) {
          // Reset failed attempts on successful login
          db.run("UPDATE users SET failed_attempts = 0 WHERE email = ?", [
            email,
          ]);
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
      } catch (error) {
        console.error("Error verifying password:", error);
        return res.status(500).send("Internal Server Error");
      }
    } else {
      return res.status(401).send("Unauthorized: Email not found.");
    }
  });
};

exports.getRegister = (req, res) => {
  res.render("register");
};

exports.postRegister = async (req, res) => {
  const { email, username, password } = req.body;

  // Input validation
  if (
    !validator.isEmail(email) ||
    !validator.isLength(username, { min: 3, max: 50 }) ||
    !validator.isStrongPassword(password, { minLength: 8 })
  ) {
    return res.status(400).send("Invalid input.");
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Default values for new users
    const role = "user"; // Assign default role as 'user'
    const locked = 0; // Account is not locked by default

    // Insert the new user into the database
    const insertQuery = `INSERT INTO users (email, username, password, role, is_locked) 
                     VALUES (?, ?, ?, ?, ?)`;
    db.run(
      insertQuery,
      [email, username, hashedPassword, role, locked],
      (err) => {
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
      }
    );
  } catch (error) {
    console.error("Error hashing password:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};
