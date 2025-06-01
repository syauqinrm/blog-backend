const { validationResult } = require('express-validator');
const authService = require('../services/authService');

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    const code = error.code || 400;
    res.status(code).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const token = await authService.login(req.body.email, req.body.password);
    res.json({ accessToken: token });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};
