const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET doit être défini en production');
  }
  return 'development-only-change-this-secret';
};

const authenticate = (req, res, next) => {
  const token = req.cookies?.fiscal_session;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentification requise' });
  }

  try {
    req.user = jwt.verify(token, getJwtSecret());
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Session invalide ou expirée' });
  }
};

/**
 * Restreint une route aux agents dont le rôle figure dans `roles`.
 * À utiliser après `authenticate`, qui renseigne `req.user`.
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs',
    });
  }

  return next();
};

const requireAdmin = authorize('admin');

module.exports = { authenticate, authorize, getJwtSecret, requireAdmin };