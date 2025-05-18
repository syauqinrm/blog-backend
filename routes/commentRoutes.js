const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { body } = require('express-validator');

router.get('/post/:postId', commentController.getCommentsByPostId);

router.post(
  '/',
  authMiddleware,
  [
    body('post_id').isInt().withMessage('post_id harus berupa angka'),
    body('comment').notEmpty().withMessage('Komentar wajib diisi').isLength({ max: 250 }).withMessage('Komentar maksimal 250 karakter'),
  ],
  commentController.createComment
);

router.delete('/:id', authMiddleware, commentController.deleteComment);

module.exports = router;
