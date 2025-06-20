const { Pool } = require('pg');

const pool = new Pool({
  user: 'dbuser',
  host: 'database.server.com',
  database: 'car_rental_db',
  password: 'secretpassword',
  port: 5432,
  // Allow tests to run faster by exiting idle clients sooner if needed
  // idleTimeoutMillis: process.env.NODE_ENV === 'test' ? 1000 : 30000,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: async () => pool.connect(), // Useful for transactions in tests if needed
  end: async () => {
    if (process.env.NODE_ENV === 'test') { // Only end pool in test environment
        await pool.end();
    }
  }
};
