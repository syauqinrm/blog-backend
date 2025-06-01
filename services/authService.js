const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.register = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw { code: 400, message: 'Email sudah digunakan' };
  }

  // Normalisasi role dan validasi
  const finalRole = (role || 'pembaca').toLowerCase();

  if (finalRole === 'editor') {
    throw { code: 403, message: 'Role editor tidak boleh dibuat melalui register' };
  }

  if (!['pembaca', 'penulis'].includes(finalRole)) {
    throw { code: 400, message: 'Role tidak valid. Gunakan "pembaca" atau "penulis"' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({ name, email, password: hashedPassword, role: finalRole });

  return {
    message: 'Registrasi berhasil',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    },
  };
};

exports.login = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error('Email atau password salah');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Email atau password salah');

  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};
