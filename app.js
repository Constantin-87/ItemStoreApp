require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const https = require("https");
const fs = require("fs");
const logger = require("./utils/logger");

const app = express();

// Load SSL certificates
const options = {
  key: fs.readFileSync(path.join(__dirname, "certs", "key.pem")), // Path to your SSL key
  cert: fs.readFileSync(path.join(__dirname, "certs", "cert.pem")), // Path to your SSL certificate
};

// Routes
const authRoutes = require("./routes/authRoute");
const itemRoutes = require("./routes/itemsRoute");
const adminRoutes = require("./routes/adminRoute");

// Middleware
const { isAuthenticated, isAdmin } = require("./middleware/auth");
const { handleSessionTimeout } = require("./middleware/sessions");

// Apply security headers using Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"], // Allow only content from the same origin
        "script-src": ["'self'"], // Allow scripts only from the same origin
        "style-src": ["'self'"], // Allow styles only from the same origin
        "img-src": ["'self'", "data:"], // Allow images from the same origin and inline data URIs
        "font-src": ["'self'"], // Allow fonts from secure origins only
        "object-src": ["'none'"], // Disallow <object>, <embed>, and <applet> tags
        "frame-ancestors": ["'self'"],
        "form-action": ["'self'"], // Ensure forms are submitted only to the same origin
        "base-uri": ["'self'"],
        "connect-src": ["'self'"], // Restrict AJAX and WebSocket connections to the same origin
        "upgrade-insecure-requests": [], // Automatically upgrade HTTP requests to HTTPS
      },
    },
    crossOriginEmbedderPolicy: true,
    referrerPolicy: { policy: "no-referrer" },
  })
);

// Ensure HSTS is enabled for localhost HTTPS
app.use(
  helmet.hsts({
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  })
);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 10 * 60 * 1000, // 10 minutes
    },
  })
);

// Log session initialization
app.use((req, res, next) => {
  if (req.session) {
    logger.info(
      `Session initialized for user: ${req.session.userId || "Guest"}`
    );
  }
  next();
});

// Apply session timeout middleware to non-auth routes
app.use((req, res, next) => {
  if (!["/login", "/register"].includes(req.path)) {
    handleSessionTimeout(req, res, next);
  } else {
    next();
  }
});

// Parse cookies (required for CSRF)
app.use(cookieParser());

// Initialize CSRF protection
const csrfProtection = csrf({
  cookie: {
    httpOnly: true, // Prevent client-side JavaScript access
    secure: true, // Ensure the cookie is sent only over HTTPS
    sameSite: "strict", // Prevent cross-site request forgery attacks
  },
});
app.use(csrfProtection);

// Set CSRF token in locals for use in EJS templates
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
  logger.info("CSRF token generated successfully.");
});

// Routes
app.use("/", authRoutes);
app.use("/items", isAuthenticated, itemRoutes);
app.use("/admin", isAuthenticated, isAdmin, adminRoutes);

// Root route: Redirect based on authentication status
app.get("/", (req, res) => {
  if (req.session.userId) {
    logger.info(`User ${req.session.userId} accessed the root route.`);
    res.redirect("/items"); // Redirect to items page if logged in
  } else {
    logger.info("Guest user accessed the root route, redirected to login.");
    res.redirect("/login"); // Redirect to login page if not logged in
  }
});

// Error-handling middleware for CSRF errors
app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    logger.error(`CSRF token validation failed. Details: ${err.stack || err}`);
    return res.status(403).send("Forbidden: Invalid CSRF token.");
  }
  next(err);
});

// CSP error handling
app.use((err, req, res, next) => {
  if (err.message && err.message.includes("Content Security Policy")) {
    logger.error(`CSP Violation: ${err.message}`);
    res.status(400).send("Content Security Policy violation detected.");
  } else {
    next(err);
  }
});

// Generic error-handling middleware for other errors
app.use((err, req, res, next) => {
  logger.error(
    `Unhandled error occurred at ${req.path}. Details: ${err.stack || err}`
  );
  res.status(500).send("An unexpected error occurred. Please try again later.");
});

// Start HTTPS server
https.createServer(options, app).listen(process.env.PORT, () => {
  logger.info(
    `Server is running securely on https://localhost:${process.env.PORT}`
  );
});
