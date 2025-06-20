const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON bodies
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const carRoutes = require('./routes/cars');
const rentalRoutes = require('./routes/rentals');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/rentals', rentalRoutes);

app.get('/', (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

// Start server only if not in test environment or if this file is run directly
// The 'require.main === module' check ensures this file is run directly (e.g. node index.js)
// and not when imported by another module (like our test files).
if (process.env.NODE_ENV !== 'test' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app; // Export app for testing
