const jwt = require('jsonwebtoken');
const JWT_SECRET = 'yourjwtsecret'; // Same placeholder secret as in auth.js

module.exports = function(req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');

  // Check if not token
  if (!authHeader) {
    return res.status(401).json({ message: 'No token, authorization denied.' });
  }

  // Check if token is in Bearer format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Token is not in Bearer format.' });
  }
  const token = parts[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    // Add user from payload
    req.user = decoded; // The decoded token usually contains user info like id, username
    next();
  } catch (e) {
    res.status(400).json({ message: 'Token is not valid.' });
  }
};
