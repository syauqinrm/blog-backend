const { User } = require('../models');
const bcrypt = require('bcrypt');

// GET /users
exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'editor') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya editor yang diizinkan.' });
    }

    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt']
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data user', error });
  }
};

// GET /users/:id
exports.getUserById = async (req, res) => {
  try {
    if (req.user.role !== 'editor') {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt']
    });

    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data user', error });
  }
};

// PUT /users/:id
exports.updateUser = async (req, res) => {
  try {
    if (req.user.role !== 'editor') {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    if (user.role === 'editor') {
      return res.status(403).json({ message: 'Tidak dapat mengubah user dengan role editor.' });
    }

    const { name, email, role, password } = req.body;

    // Cegah update ke role editor
    if (role === 'editor') {
      return res.status(403).json({ message: 'Tidak dapat mengubah role menjadi editor.' });
    }

    // Siapkan update data
    const updateData = { name, email, role };

    // Jika ada password, hash terlebih dahulu
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    await user.update(updateData);
    res.json({ message: 'User berhasil diperbarui', user });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui user', error });
  }
};

// DELETE /users/:id
exports.deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'editor') {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    if (user.role === 'editor') {
      return res.status(403).json({ message: 'Tidak dapat menghapus user dengan role editor.' });
    }

    await user.destroy();
    res.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus user', error });
  }
};
