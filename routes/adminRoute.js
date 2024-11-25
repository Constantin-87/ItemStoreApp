const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const adminController = require("../controllers/adminController");

// Route to view all users
router.get("/", isAuthenticated, isAdmin, adminController.getUsers);

// Route to delete a user
router.post(
  "/delete/:id",
  isAuthenticated,
  isAdmin,
  adminController.deleteUser
);

// Route to lock/unlock a user account
router.post(
  "/toggle-lock/:id",
  isAuthenticated,
  isAdmin,
  adminController.toggleLock
);

module.exports = router;
