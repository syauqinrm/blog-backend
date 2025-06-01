const commentService = require('../services/commentService');
const commentTransformer = require('../transformers/commentTransformer');

exports.createComment = async (req, res) => {
  try {
    const comment = await commentService.createComment({
      userId: req.user.id,
      postId: req.body.post_id,
      content: req.body.comment,
    });
    res.status(201).json({
      message: 'Komentar berhasil ditambahkan!',
      comment: commentTransformer.transform(comment),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const result = await commentService.deleteComment(req.params.id, req.user);
    res.json({ message: result });
  } catch (error) {
    res.status(error.code || 500).json({ message: error.message });
  }
};
