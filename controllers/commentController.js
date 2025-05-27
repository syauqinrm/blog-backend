const { Comment, Post, User } = require('../models');

// POST /comments (semua user login)
exports.createComment = async (req, res) => {
  try {
    const { comment, post_id } = req.body;

    const post = await Post.findByPk(post_id);
    if (!post) return res.status(404).json({ message: 'Post tidak ditemukan' });

    const newComment = await Comment.create({
      comment,
      post_id,
      user_id: req.user.id
    });

    res.status(201).json({ message: 'Komentar berhasil ditambahkan!', newComment });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambahkan komentar', error });
  }
};

// DELETE /comments/:id
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Komentar tidak ditemukan' });

    // Editor bisa hapus semua komentar
    if (req.user.role === 'editor') {
      await comment.destroy();
      return res.json({ message: 'Komentar dihapus oleh editor' });
    }

    // Pembaca hanya boleh hapus komentarnya sendiri
    if (req.user.role === 'pembaca' && comment.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    // Penulis bisa hapus komentarnya sendiri ATAU komentar di post miliknya
    if (req.user.role === 'penulis') {
      const post = await Post.findByPk(comment.post_id);
      if (comment.user_id !== req.user.id && post.user_id !== req.user.id) {
        return res.status(403).json({ message: 'Akses ditolak' });
      }
    }

    await comment.destroy();
    res.json({ message: 'Komentar berhasil dihapus!' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus komentar', error });
  }
};
