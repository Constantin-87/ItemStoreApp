const db = require("../database");
const xss = require("xss");
const validator = require("validator");
const logger = require("../utils/logger");

// Utility function for handling database errors
const handleDatabaseError = (err, res) => {
  if (err) {
    logger.error(`Database Error: ${err.message}`);
    return res.status(500).send("Database Error");
  }
};

// Fetch all items
exports.getItems = (req, res) => {
  const userId = req.session.userId;
  const role = req.session.role;
  const query = `SELECT * FROM items WHERE user_id = ?`;

  db.all(query, [userId], (err, items) => {
    if (err) {
      handleDatabaseError(err, res);
      return;
    }
    logger.info(`Fetched items for user ID: ${userId}`);
    res.render("home", {
      items,
      username: req.session.username,
      role,
      query: "",
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
    return res.status(400).send("Invalid input.");
  }

  const parsedQuantity = parseInt(quantity, 10);

  // Step 1: Check if the item with the given name already exists
  const query = `SELECT * FROM items WHERE name = ? AND user_id = ?`;
  db.get(query, [name, userId], (err, existingItem) => {
    if (err) {
      handleDatabaseError(err, res);
      return;
    }

    if (existingItem) {
      // Step 2: If item exists, update its quantity
      const newQuantity = existingItem.quantity + parsedQuantity;
      const updateQuery = `UPDATE items SET quantity = ? WHERE id = ?`;
      db.run(updateQuery, [newQuantity, existingItem.id], (err) => {
        if (err) {
          handleDatabaseError(err, res);
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
          handleDatabaseError(err, res);
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
      handleDatabaseError(err, res);
      return;
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
      handleDatabaseError(err, res);
      return;
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
        `Error searching for items for user ID: ${userId}, query: '${query}'`
      );
      items = null;
    } else {
      logger.info(
        `Searched for items for user ID: ${userId}, query: '${query}', found: ${
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
