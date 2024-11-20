const db = require("../database");

// Utility function for handling database errors
const handleDatabaseError = (err, res) => {
  if (err) {
    console.error(err);
    // Sensitive data exposure
    return res.status(500).send(`Database Error: ${err.message}`);
  }
};

// Fetch all items
exports.getItems = (req, res) => {
  const userId = req.session.userId;
  const role = req.session.role;
  const query = `SELECT * FROM items WHERE user_id = ?`;

  db.all(query, [userId], (err, items) => {
    handleDatabaseError(err, res);

    res.render("home", {
      items,
      username: req.session.username,
      role,
      query: "",
    });
  });
};

// Add a new item or update the quantity if it already exists - Vulnerable Stored XSS
exports.addItem = (req, res) => {
  const { name, quantity } = req.body;
  const parsedQuantity = parseInt(quantity, 10);
  const userId = req.session.userId;

  // Step 1: Check if the item with the given name already exists
  const query = `SELECT * FROM items WHERE name = ? AND user_id = ?`;
  db.get(query, [name, userId], (err, existingItem) => {
    handleDatabaseError(err, res);

    if (existingItem) {
      // Step 2: If item exists, update its quantity
      const newQuantity = existingItem.quantity + parsedQuantity;
      const updateQuery = `UPDATE items SET quantity = ? WHERE id = ?`;
      db.run(updateQuery, [newQuantity, existingItem.id], (err) => {
        console.error("Executing the update query:", updateQuery);
        handleDatabaseError(err, res);
        res.redirect("/items");
      });
    } else {
      // Step 3: If item does not exist, insert it as a new item
      const insertQuery = `INSERT INTO items (name, quantity, user_id) VALUES (?, ?, ?)`;
      db.run(insertQuery, [name, parsedQuantity, userId], (err) => {
        console.error("Executing the insert query:", insertQuery);
        handleDatabaseError(err, res);
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
    handleDatabaseError(err, res);
    res.redirect("/items");
  });
};

// Delete an item
exports.deleteItem = (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;
  const deleteQuery = `DELETE FROM items WHERE id = ? AND user_id = ?`;
  db.run(deleteQuery, [id, userId], (err) => {
    handleDatabaseError(err, res);
    res.redirect("/items");
  });
};

// Search items by name - // Vulnerable to both SQL Injection and Reflected XSS
exports.searchItems = (req, res) => {
  const { query } = req.query;
  const userId = req.session.userId;
  const role = req.session.role;

  const searchQuery = `SELECT * FROM items WHERE name LIKE '%${query}%' AND user_id = ${userId}`;

  db.all(searchQuery, [], (err, items) => {
    // Handle the database error but still render the view with the search query
    if (err) {
      console.error("Database Error:", err.message);
      items = null;
    }

    // Render the home view with the search results
    res.render("home", {
      items: items || [],
      username: req.session.username,
      role,
      query, // Reflecting the user input without sanitization
    });
  });
};
