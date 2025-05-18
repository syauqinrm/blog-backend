const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { body } = require('express-validator');

// GET /comments/post/:postId
exports.getCommentsByPostId = async (req, res) => {
    try {
      const postId = req.params.postId;
  
      const comments = await Comment.findAll({
        where: { post_id: postId },
        include: [{ model: User, attributes: ['id', 'name'] }]
      });
  
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: 'Gagal mengambil komentar', error });
    }
  };
  
router.post(
  '/',
  authMiddleware.authenticateToken,
  [
    body('post_id').isInt().withMessage('post_id harus berupa angka'),
    body('comment').notEmpty().withMessage('Komentar wajib diisi').isLength({ max: 250 }).withMessage('Komentar maksimal 250 karakter'),
  ],
  commentController.createComment
);

router.delete('/:id', authMiddleware.authenticateToken, commentController.deleteComment);

module.exports = router;
