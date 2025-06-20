const express = require('express');
const db = require('../db'); // Assuming db.js is in the parent directory
const router = express.Router();

// GET all cars (consider adding filtering for available cars, e.g., WHERE available = TRUE)
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM cars ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ message: 'Error fetching cars.', error: error.message });
  }
});

// GET a specific car by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM cars WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found.' });
    }
    res.json(result.rows[0]);
  } catch (error) <img src="https://ci3.googleusercontent.com/mail-sig/AIorK4x5b_Q3J5kXoGFyX-pB6zW6j47uOOMP3XZCC24y4mYh_KDNK_K840yOqWJ5H3U5lJ8zXl5hQZg" width="1" height="1">{
    console.error(`Error fetching car ${id}:`, error);
    res.status(500).json({ message: 'Error fetching car.', error: error.message });
  }
});

// POST a new car
router.post('/', async (req, res) => {
  const { make, model, year, price_per_day, available } = req.body;

  if (!make || !model || !year || price_per_day === undefined) {
    return res.status(400).json({ message: 'Missing required fields: make, model, year, price_per_day.' });
  }

  try {
    const result = await db.query(
      'INSERT INTO cars (make, model, year, price_per_day, available) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [make, model, year, price_per_day, available === undefined ? true : available]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding new car:', error);
    res.status(500).json({ message: 'Error adding new car.', error: error.message });
  }
});

// PUT (update) an existing car by ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { make, model, year, price_per_day, available } = req.body;

  if (!make && !model && year === undefined && price_per_day === undefined && available === undefined) {
    return res.status(400).json({ message: 'No fields provided for update.' });
  }

  // Build the update query dynamically
  const fields = [];
  const values = [];
  let paramCount = 1;

  if (make !== undefined) {
    fields.push(`make = $${paramCount++}`);
    values.push(make);
  }
  if (model !== undefined) {
    fields.push(`model = $${paramCount++}`);
    values.push(model);
  }
  if (year !== undefined) {
    fields.push(`year = $${paramCount++}`);
    values.push(year);
  }
  if (price_per_day !== undefined) {
    fields.push(`price_per_day = $${paramCount++}`);
    values.push(price_per_day);
  }
  if (available !== undefined) {
    fields.push(`available = $${paramCount++}`);
    values.push(available);
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: "No valid fields to update provided." });
  }

  const queryString = `UPDATE cars SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  values.push(id);

  try {
    const result = await db.query(queryString, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error updating car ${id}:`, error);
    res.status(500).json({ message: 'Error updating car.', error: error.message });
  }
});

// DELETE a car by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM cars WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found.' });
    }
    res.json({ message: 'Car deleted successfully.', car: result.rows[0] });
  } catch (error) {
    console.error(`Error deleting car ${id}:`, error);
    res.status(500).json({ message: 'Error deleting car.', error: error.message });
  }
});

module.exports = router;
