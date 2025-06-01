const { User } = require('../models');

exports.getAllUsers = async (user) => {
  if (user.role !== 'editor') {
    throw { code: 403, message: 'Akses ditolak' };
  }
  return await User.findAll();
};

exports.getUserById = async (user, id) => {
  if (user.role !== 'editor' && user.id !== parseInt(id)) {
    throw { code: 403, message: 'Akses ditolak' };
  }

  const target = await User.findByPk(id);
  if (!target) throw { code: 404, message: 'User tidak ditemukan' };
  return target;
};

exports.updateUser = async (user, id, data) => {
  if (user.role !== 'editor' && user.id !== parseInt(id)) {
    throw { code: 403, message: 'Tidak boleh mengedit user ini' };
  }

  const target = await User.findByPk(id);
  if (!target) throw { code: 404, message: 'User tidak ditemukan' };

  await target.update(data);
  return target;
};

exports.deleteUser = async (user, id) => {
  if (user.role !== 'editor') {
    throw { code: 403, message: 'Hanya editor yang boleh menghapus user' };
  }

  const target = await User.findByPk(id);
  if (!target) throw { code: 404, message: 'User tidak ditemukan' };

  await target.destroy();
  return 'User berhasil dihapus';
};
