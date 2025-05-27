const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN

  if (!token) return res.status(401).json({ message: 'Token tidak ditemukan' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);  // Ganti decoded.userId jadi decoded.id
    if (!user) return res.status(401).json({ message: 'User tidak ditemukan' });

    req.user = user; // simpan info user ke req
    next();
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: 'Token tidak valid atau sudah kedaluwarsa' });
  }
};
