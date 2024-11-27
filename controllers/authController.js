const db = require("../database");
const validator = require("validator");
const bcrypt = require("bcrypt");
const logger = require("../utils/logger");

exports.getLogin = (req, res) => {
  const errorMessage = req.query.errorMessage || null;
  logger.info("Accessed login page");
  if (errorMessage) logger.info(`Logout message displayed: ${errorMessage}`);
  res.render("login", { csrfToken: req.csrfToken(), errorMessage });
};

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!validator.isEmail(email) || validator.isEmpty(password)) {
    logger.warn(`Invalid login attempt with email: ${email}`);
    return res.status(400).send("Invalid input.");
  }

  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) {
      logger.error(
        `Database error during login attempt for email ${email}: ${
          err.stack || err.message
        }`
      );
      return res
        .status(500)
        .send("An unexpected error occurred. Please try again later.");
    }

    if (user) {
      if (user.is_locked) {
        logger.warn(`Login attempt for locked account: ${email}`);
        return res
          .status(403)
          .send("Account is locked. Please contact an administrator.");
      }

      try {
        // Verify the password
        const match = await bcrypt.compare(password, user.password);

        if (match) {
          // Reset failed attempts on successful login
          db.run(
            "UPDATE users SET failed_attempts = 0 WHERE email = ?",
            [email],
            (err) => {
              if (err)
                logger.error(
                  `Failed to reset failed_attempts for user ${email}: ${
                    err.stack || err.message
                  }`
                );
            }
          );

          req.session.regenerate((err) => {
            if (err) {
              logger.error(
                `Session regeneration error for user ${email}: ${
                  err.stack || err.message
                }`
              );
              return res
                .status(500)
                .send("An unexpected error occurred. Please try again later.");
            }

            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.role = user.role;

            logger.info(`User ${email} successfully logged in.`);
            return res.redirect("/items");
          });
        } else {
          // Increment failed attempts if password is incorrect
          const newAttempts = user.failed_attempts + 1;

          if (newAttempts >= 5) {
            // Lock the account after 5 failed attempts
            db.run(
              "UPDATE users SET is_locked = 1, failed_attempts = ? WHERE email = ?",
              [newAttempts, email],
              (err) => {
                if (err)
                  logger.error(
                    `Failed to lock user ${email}: ${err.stack || err.message}`
                  );
              }
            );
            logger.warn(
              `Account locked due to too many failed attempts: ${email}`
            );
            return res
              .status(403)
              .send("Account is locked due to too many failed attempts.");
          } else {
            // Update failed attempts count
            db.run(
              "UPDATE users SET failed_attempts = ? WHERE email = ?",
              [newAttempts, email],
              (err) => {
                if (err)
                  logger.error(
                    `Failed to update failed_attempts for user ${email}: ${
                      err.stack || err.message
                    }`
                  );
              }
            );
            logger.warn(
              `Incorrect password attempt for user ${email}. Failed attempts: ${newAttempts}`
            );
            return res
              .status(401)
              .send("Unauthorized: Incorrect email or password.");
          }
        }
      } catch (error) {
        logger.error(
          `Error verifying password for user ${email}: ${
            error.stack || error.message
          }`
        );
        return res
          .status(500)
          .send("An unexpected error occurred. Please try again later.");
      }
    } else {
      logger.warn(`Login attempt with unregistered email: ${email}`);
      return res.status(401).send("Unauthorized: Incorrect email or password.");
    }
  });
};

exports.getRegister = (req, res) => {
  logger.info("Accessed registration page");
  res.render("register");
};

exports.postRegister = async (req, res) => {
  const { email, username, password } = req.body;

  // Input validation
  if (!validator.isEmail(email)) {
    logger.warn(`Invalid email during registration attempt: ${email}`);
    return res
      .status(400)
      .send("Invalid email address. Please enter a valid email.");
  }

  if (!/^[a-zA-Z._]{3,25}$/.test(username)) {
    logger.warn(`Invalid username during registration attempt: ${username}`);
    return res
      .status(400)
      .send(
        "Invalid username. Username must be 3-25 characters long and can only include letters, underscores, or periods."
      );
  }

  if (!validator.isStrongPassword(password, { minLength: 8 })) {
    logger.warn(
      `Weak password during registration attempt for email: ${email}`
    );
    return res
      .status(400)
      .send(
        "Weak password. Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and special characters."
      );
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
          if (err.code === "SQLITE_CONSTRAINT") {
            // Handle unique constraint error for email
            logger.warn(`Registration attempt with existing email: ${email}`);
            return res
              .status(400)
              .send(
                "The email address is already in use. Please try a different one."
              );
          }

          logger.error(
            `Failed to register user ${email}: ${err.stack || err.message}`
          );
          return res
            .status(500)
            .send("An unexpected error occurred. Please try again later.");
        }
        logger.info(`User ${email} registered successfully.`);
        // If registration is successful, automatically log in the user
        db.get(
          "SELECT * FROM users WHERE username = ?",
          [username],
          (err, user) => {
            if (err) {
              logger.error(
                `Database error during post-registration login for user ${email}: ${
                  err.stack || err.message
                }`
              );
              return res
                .status(500)
                .send("An unexpected error occurred. Please try again later.");
            }
            if (user) {
              req.session.userId = user.id;
              req.session.username = user.username;
              req.session.role = user.role;
              logger.info(
                `User ${email} successfully logged in after registration.`
              );
              return res.redirect("/items");
            }
            res.redirect("/login");
          }
        );
      }
    );
  } catch (error) {
    logger.error(
      `Error hashing password for user ${email}: ${
        error.stack || error.message
      }`
    );
    res
      .status(500)
      .send("An unexpected error occurred. Please try again later.");
  }
};

exports.logout = (req, res) => {
  const userId = req.session.userId;
  req.session.destroy((err) => {
    if (err) {
      logger.error(
        `Error destroying session for user ID ${userId}: ${
          err.stack || err.message
        }`
      );
    } else {
      logger.info(`User ID ${userId} logged out successfully.`);
    }
    res.redirect("/login");
  });
};
