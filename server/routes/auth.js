const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Assuming db.js is in the parent directory

const router = express.Router();
const JWT_SECRET = 'yourjwtsecret'; // Placeholder secret

// Register Route
router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: 'Please provide username, password, and email.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
      [username, hashedPassword, email]
    );
    res.status(201).json({ message: 'User registered successfully!', user: result.rows[0] });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === '23505') { // Unique constraint violation
        if (error.constraint === 'users_username_key') {
            return res.status(400).json({ message: 'Username already exists.' });
        }
        if (error.constraint === 'users_email_key') {
            return res.status(400).json({ message: 'Email already exists.' });
        }
    }
    res.status(500).json({ message: 'Error registering user.', error: error.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    res.json({ message: 'Logged in successfully!', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in.', error: error.message });
  }
});

module.exports = router;
