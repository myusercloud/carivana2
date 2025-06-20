const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// POST /api/rentals - Create a new rental
router.post('/', authMiddleware, async (req, res) => {
  const { car_id, start_date, end_date } = req.body;
  const user_id = req.user.id; // Extracted from token by authMiddleware

  if (!car_id || !start_date || !end_date) {
    return res.status(400).json({ message: 'Missing required fields: car_id, start_date, end_date.' });
  }

  try {
    // Fetch car details to check availability and calculate price
    const carResult = await db.query('SELECT price_per_day, available FROM cars WHERE id = $1', [car_id]);
    if (carResult.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found.' });
    }
    if (!carResult.rows[0].available) {
      return res.status(400).json({ message: 'Car is not available for rent.' });
    }

    const price_per_day = parseFloat(carResult.rows[0].price_per_day);
    const sDate = new Date(start_date);
    const eDate = new Date(end_date);

    if (sDate >= eDate) {
        return res.status(400).json({ message: 'End date must be after start date.' });
    }
    if (sDate < new Date().setHours(0,0,0,0)) { // Compare with today's date at midnight
        return res.status(400).json({ message: 'Start date cannot be in the past.' });
    }

    // Calculate duration in days (ensure it's at least 1 day)
    const durationInMilliseconds = eDate - sDate;
    const durationInDays = Math.ceil(durationInMilliseconds / (1000 * 60 * 60 * 24));

    if (durationInDays <= 0) {
        return res.status(400).json({ message: 'Rental duration must be at least one day.'});
    }

    const total_price = durationInDays * price_per_day;

    // Start a transaction
    await db.query('BEGIN');

    // Insert the rental
    const rentalResult = await db.query(
      'INSERT INTO rentals (user_id, car_id, start_date, end_date, total_price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, car_id, start_date, end_date, total_price]
    );

    // Mark the car as unavailable
    await db.query('UPDATE cars SET available = FALSE WHERE id = $1', [car_id]);

    // Commit the transaction
    await db.query('COMMIT');

    res.status(201).json(rentalResult.rows[0]);
  } catch (error) {
    await db.query('ROLLBACK'); // Rollback transaction on error
    console.error('Error creating rental:', error);
    res.status(500).json({ message: 'Error creating rental.', error: error.message });
  }
});

// GET /api/rentals - Get rental history for the authenticated user
router.get('/', authMiddleware, async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await db.query(
      `SELECT r.id, r.start_date, r.end_date, r.total_price, r.created_at,
              c.make, c.model, c.year, c.price_per_day AS car_price_per_day
       FROM rentals r
       JOIN cars c ON r.car_id = c.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [user_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching rental history:', error);
    res.status(500).json({ message: 'Error fetching rental history.', error: error.message });
  }
});

// GET /api/rentals/:id - Get specific rental details for the authenticated user
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id; // Or check for admin role: req.user.role === 'admin'

  try {
    const result = await db.query(
      `SELECT r.id, r.user_id, r.start_date, r.end_date, r.total_price, r.created_at,
              c.make, c.model, c.year, c.price_per_day AS car_price_per_day
       FROM rentals r
       JOIN cars c ON r.car_id = c.id
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Rental not found.' });
    }

    // Check if the rental belongs to the authenticated user (or if user is admin)
    if (result.rows[0].user_id !== user_id /* && req.user.role !== 'admin' */) {
      return res.status(403).json({ message: 'Access denied. You do not own this rental.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error fetching rental ${id}:`, error);
    res.status(500).json({ message: 'Error fetching rental details.', error: error.message });
  }
});

module.exports = router;
