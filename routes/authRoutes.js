const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { body } = require('express-validator');

router.post(
    '/register',
    [
      body('name').notEmpty().withMessage('Nama wajib diisi'),
      body('email').isEmail().withMessage('Email tidak valid'),
      body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
      body('role').optional().isIn(['pembaca', 'penulis', 'editor']).withMessage('Role harus pembaca, atau penulis'),
    ],
    register
  );
  

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email tidak valid'),
    body('password').notEmpty().withMessage('Password wajib diisi'),
  ],
  login
);

module.exports = router;
