const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { body } = require('express-validator');

router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);

router.post(
  '/',
  authMiddleware.authenticateToken,
  authorizeRoles('penulis', 'editor'),
  [
    body('title').notEmpty().withMessage('Judul wajib diisi'),
    body('content').notEmpty().withMessage('Konten wajib diisi'),
    body('status').optional().isIn(['draft', 'published']).withMessage('Status harus draft atau published'),
  ],
  postController.createPost
);

router.put(
  '/:id',
  authMiddleware.authenticateToken,
  authorizeRoles('penulis', 'editor'),
  [
    body('title').optional().notEmpty().withMessage('Judul tidak boleh kosong'),
    body('content').optional().notEmpty().withMessage('Konten tidak boleh kosong'),
    body('status').optional().isIn(['draft', 'published']).withMessage('Status harus draft atau published'),
  ],
  postController.updatePost
);

router.delete(
  '/:id',
  authMiddleware.authenticateToken,
  authorizeRoles('penulis', 'editor'),
  postController.deletePost
);

module.exports = router;
