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

    if (user.status === 'Suspended') {
      const allowedPaths = [
        '/api/auth/me',
        '/api/auth/logout'
      ];
      const isAllowed = allowedPaths.some(path => req.originalUrl.startsWith(path)) ||
                        req.originalUrl.includes('/reactivation-request') ||
                        req.originalUrl.includes('/reactivation-status');

      if (!isAllowed) {
        return res.status(403).json({
          error: 'Account is suspended. Please contact your manager.',
          code: 'ACCOUNT_SUSPENDED',
          suspendedBy: user.suspendedBy,
          reason: user.suspendReason
        });
      }
    }

    if (user.isLocked) {
      return res.status(403).json({ error: 'Account is locked. Please contact Admin.' });
    }

    req.user = user;

    if (!user.isActive) {
      // Inactive users are restricted only to profile me, logout, and activation request operations
      const allowedPaths = [
        '/api/auth/me',
        '/api/auth/logout',
        '/api/requests'
      ];
      const isAllowed = allowedPaths.some(path => req.originalUrl.startsWith(path));
      if (!isAllowed) {
        return res.status(403).json({ error: 'Account is inactive.', code: 'ACCOUNT_INACTIVE' });
      }
    }

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
