require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();
const authRoutes = require("./routes/authRoute");
const itemRoutes = require("./routes/itemsRoute");
const adminRoutes = require("./routes/adminRoute");
const { isAuthenticated, isAdmin } = require("./middleware/auth");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true },
  })
);

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

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
