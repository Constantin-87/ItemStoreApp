const express = require("express");
const itemController = require("../controllers/itemController");
const { isAuthenticated } = require("../middleware/auth");
const router = express.Router();

router.get("/", isAuthenticated, itemController.getItems);
router.post("/add", isAuthenticated, itemController.addItem);
router.post("/edit/:id", isAuthenticated, itemController.editItem);
router.post("/delete/:id", isAuthenticated, itemController.deleteItem);
router.get("/search", isAuthenticated, itemController.searchItems);

module.exports = router;
