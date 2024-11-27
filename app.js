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
    // Configure Content Security Policy (CSP) to restrict resources and mitigate XSS
    contentSecurityPolicy: {
      useDefaults: true, // Use Helmet's default secure CSP configuration
      directives: {
        "default-src": ["'self'"], // Restrict all content (scripts, styles, etc.) to the same origin by default
        "object-src": ["'none'"], // Block the use of <object>, <embed>, and <applet> tags to prevent plugin-based attacks
        "frame-ancestors": ["'self'"], // Prevent the page from being embedded in frames by external sites (mitigates clickjacking)
        "form-action": ["'self'"], // Ensure forms can only be submitted to the same origin
        "base-uri": ["'self'"], // Restrict the use of <base> tag to the same origin
        "connect-src": ["'self'"], // Allow only same-origin connections for AJAX or WebSocket requests
        "upgrade-insecure-requests": [], // Automatically upgrade HTTP requests to HTTPS (enabled for browsers that support it)
      },
    },
    // Enforce Cross-Origin Embedder Policy to mitigate speculative attacks like Spectre
    crossOriginEmbedderPolicy: true,
    // Configure Referrer-Policy to avoid leaking sensitive data through the Referer header
    referrerPolicy: { policy: "no-referrer" }, // No referrer information is sent with requests
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
