const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateUser = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).populate('role');

    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    if (user.isLocked) {
      return res.status(403).json({ error: 'Account is locked. Please contact Admin.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Role authorization failed.' });
    }

    // Super Admin overrides all role checks
    if (req.user.role.name === 'Super Admin') {
      return next();
    }

    if (!roles.includes(req.user.role.name)) {
      return res.status(403).json({ error: 'Forbidden. You do not have permission to access this resource.' });
    }

    next();
  };
};

module.exports = {
  authenticateUser,
  authorizeRoles
};
