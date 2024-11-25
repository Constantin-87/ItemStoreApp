const db = require("../database");
const xss = require("xss");
const validator = require("validator");
const logger = require("../utils/logger");

// Utility function for handling database errors
const handleDatabaseError = (err, res, action = "performing operation") => {
  if (err) {
    logger.error(`Error ${action}: ${err.stack || err.message}`);
    return res
      .status(500)
      .send("An unexpected error occurred. Please try again later.");
  }
};

// Fetch all items
exports.getItems = (req, res) => {
  const userId = req.session.userId;
  const role = req.session.role;
  const query = `SELECT * FROM items WHERE user_id = ?`;
  const errorMessage = req.query.errorMessage || null;

  db.all(query, [userId], (err, items) => {
    if (err) {
      handleDatabaseError(err, res, "fetching items");
      return;
    }
    logger.info(`Fetched items for user ID: ${userId}`);
    res.render("home", {
      items,
      username: req.session.username,
      role,
      query: "",
      errorMessage,
    });
  });
};

// Add a new item or update the quantity if it already exists
exports.addItem = (req, res) => {
  const name = xss(req.body.name);
  const quantity = req.body.quantity;
  const userId = req.session.userId;

  if (
    !validator.isLength(name, { min: 1, max: 50 }) ||
    !validator.isInt(quantity, { min: 1 })
  ) {
    logger.warn(`Invalid input while adding item for user ID: ${userId}`);
    return res.redirect(
      `/items?errorMessage=${encodeURIComponent(
        "Invalid input. Please check your item name and quantity."
      )}`
    );
  }

  const parsedQuantity = parseInt(quantity, 10);

  // Step 1: Check if the item with the given name already exists
  const query = `SELECT * FROM items WHERE name = ? AND user_id = ?`;
  db.get(query, [name, userId], (err, existingItem) => {
    if (err) {
      handleDatabaseError(err, res, "checking item existence");
      return;
    }

    if (existingItem) {
      // Step 2: If item exists, update its quantity
      const newQuantity = existingItem.quantity + parsedQuantity;
      const updateQuery = `UPDATE items SET quantity = ? WHERE id = ?`;
      db.run(updateQuery, [newQuantity, existingItem.id], (err) => {
        if (err) {
          handleDatabaseError(err, res, "updating item quantity");
          return;
        }
        logger.info(
          `Updated item '${name}' for user ID: ${userId}, new quantity: ${newQuantity}`
        );
        res.redirect("/items");
      });
    } else {
      // Step 3: If item does not exist, insert it as a new item
      const insertQuery = `INSERT INTO items (name, quantity, user_id) VALUES (?, ?, ?)`;
      db.run(insertQuery, [name, parsedQuantity, userId], (err) => {
        if (err) {
          handleDatabaseError(err, res, "inserting new item");
          return;
        }
        logger.info(
          `Added new item '${name}' for user ID: ${userId}, quantity: ${parsedQuantity}`
        );
        res.redirect("/items");
      });
    }
  });
};

// Edit an existing item
exports.editItem = (req, res) => {
  const { id } = req.params;
  const { name, quantity } = req.body;
  const userId = req.session.userId;
  const updateQuery = `UPDATE items SET name = ?, quantity = ? WHERE id = ? AND user_id = ?`;
  db.run(updateQuery, [name, quantity, id, userId], (err) => {
    if (err) {
      handleDatabaseError(err, res, "editing item");
      return res.redirect(
        `/items?errorMessage=${encodeURIComponent(
          "Failed to edit item. Please try again later."
        )}`
      );
    }
    logger.info(
      `Edited item ID: ${id} for user ID: ${userId}, new name: '${name}', new quantity: ${quantity}`
    );
    res.redirect("/items");
  });
};

// Delete an item
exports.deleteItem = (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;
  const deleteQuery = `DELETE FROM items WHERE id = ? AND user_id = ?`;
  db.run(deleteQuery, [id, userId], (err) => {
    if (err) {
      handleDatabaseError(err, res, "deleting item");
      return res.redirect(
        `/items?errorMessage=${encodeURIComponent(
          "Failed to delete item. Please try again later."
        )}`
      );
    }
    logger.info(`Deleted item ID: ${id} for user ID: ${userId}`);
    res.redirect("/items");
  });
};

// Search items by name
exports.searchItems = (req, res) => {
  let { query } = req.query;
  const userId = req.session.userId;
  const role = req.session.role;

  // Sanitize user input
  query = xss(query);

  const searchQuery = "SELECT * FROM items WHERE name LIKE ? AND user_id = ?";
  db.all(searchQuery, [`%${query}%`, userId], (err, items) => {
    // Handle the database error
    if (err) {
      logger.error(
        `Error searching items for user ID: ${userId}, query: '${query}': ${
          err.stack || err.message
        }`
      );
      items = null;
    } else {
      logger.info(
        `Searched items for user ID: ${userId}, query: '${query}', found: ${
          items?.length || 0
        }`
      );
    }

    // Render the home view with the search results
    res.render("home", {
      items: items || [],
      username: req.session.username,
      role,
      query, // Safe because it's sanitized
    });
  });
};
