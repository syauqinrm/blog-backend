const userService = require('../services/userService');
const userTransformer = require('../transformers/userTransformer');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers(req.user);
    res.json(users.map(userTransformer.transform));
  } catch (error) {
    res.status(error.code || 500).json({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user, req.params.id);
    res.json(userTransformer.transform(user));
  } catch (error) {
    res.status(error.code || 500).json({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.user, req.params.id, req.body);
    res.json({ message: 'User berhasil diperbarui', user: userTransformer.transform(user) });
  } catch (error) {
    res.status(error.code || 500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const result = await userService.deleteUser(req.user, req.params.id);
    res.json({ message: result });
  } catch (error) {
    res.status(error.code || 500).json({ message: error.message });
  }
};
