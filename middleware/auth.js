// middleware/auth.js

// Middleware to check if a user is authenticated
exports.isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  res.redirect("/login");
};

// Middleware to check if a user is an admin
exports.isAdmin = (req, res, next) => {
  if (req.session.role === "admin") {
    return next();
  }
  res.status(403).send("Access Denied: Admins only");
};
