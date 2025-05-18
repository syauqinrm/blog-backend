const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { name, email, password, role } = req.body;

  try {
    const existing = await User.findOne({ where: { email } });
    if (existing)
      return res.status(400).json({ message: 'Email sudah digunakan' });

    // Validasi role hanya boleh pembaca atau penulis
    const allowedRoles = ['pembaca', 'penulis'];
    const finalRole = role?.toLowerCase() || 'pembaca';

    if (finalRole === 'editor') {
      return res.status(403).json({ message: 'Role editor tidak boleh dibuat melalui register' });
    }

    if (!allowedRoles.includes(finalRole)) {
      return res.status(400).json({ message: 'Role tidak valid. Gunakan "pembaca" atau "penulis"' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: finalRole, // pembaca atau penulis
    });

    res.status(201).json({ message: 'Registrasi berhasil!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user)
      return res.status(401).json({ message: 'Email atau password salah' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ message: 'Email atau password salah' });

    const payload = { id: user.id, role: user.role };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '30m',
    });

    res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
