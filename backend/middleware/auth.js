const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  let token = null;

  // 1. Try to read from cookie
  if (req.headers.cookie) {
    const rawCookie = req.headers.cookie
      .split('; ')
      .find(row => row.startsWith('token='));
    if (rawCookie) {
      token = rawCookie.split('=')[1];
    }
  }

  // 2. Fallback to Authorization header
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader) {
      token = authHeader.replace('Bearer ', '');
    }
  }

  if (!token) return res.status(401).json({ message: 'Auth Error' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    if (req.user.role === 'admin' && req.user.email !== process.env.ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  } catch (e) {
    res.status(401).send({ message: 'Invalid or Expired Token' });
  }
};