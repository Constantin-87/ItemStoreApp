require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");

const app = express();

// Routes
const authRoutes = require("./routes/authRoute");
const itemRoutes = require("./routes/itemsRoute");
const adminRoutes = require("./routes/adminRoute");

// Middleware
const { isAuthenticated, isAdmin } = require("./middleware/auth");
const { handleSessionTimeout } = require("./middleware/sessions");

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
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1 * 20 * 1000, // 10 minutes
    },
  })
);

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
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Set CSRF token in locals for use in EJS templates
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Routes
app.use("/", authRoutes);
app.use("/items", isAuthenticated, itemRoutes);
app.use("/admin", isAuthenticated, isAdmin, adminRoutes);

// Root route: Redirect based on authentication status
app.get("/", (req, res) => {
  if (req.session.userId) {
    res.redirect("/items"); // Redirect to items page if logged in
  } else {
    res.redirect("/login"); // Redirect to login page if not logged in
  }
});

// Error-handling middleware for CSRF errors
app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).send("CSRF token validation failed.");
  }
  next(err);
});

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
