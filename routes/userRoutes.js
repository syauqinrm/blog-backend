const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const { body } = require('express-validator');

router.get('/', authMiddleware.authenticateToken, userController.getAllUsers);
router.get('/:id', authMiddleware.authenticateToken, userController.getUserById);

router.put(
  '/:id',
  authMiddleware.authenticateToken,
  [
    body('name').optional().notEmpty().withMessage('Nama tidak boleh kosong'),
    body('email').optional().isEmail().withMessage('Email tidak valid'),
    body('role').optional().isIn(['pembaca', 'penulis']).withMessage('Role hanya bisa diubah ke pembaca atau penulis'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  ],
  userController.updateUser
);

router.delete('/:id', authMiddleware.authenticateToken, userController.deleteUser);

module.exports = router;
