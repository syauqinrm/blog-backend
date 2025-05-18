exports.authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Akses ditolak. Role tidak diizinkan.' });
      }
      next();
    };
  };
  