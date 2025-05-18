const { Post, User, Comment } = require('../models');

// GET /posts (Publik)
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({
      include: {
        model: User,
        attributes: ['id', 'name', 'email']
      }
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data postingan', error });
  }
};

// GET /posts/:id (Publik)
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        },
        {
          model: Comment,
          include: {
            model: User,
            attributes: ['id', 'name']
          }
        }
      ]
    });
    if (!post) {
      return res.status(404).json({ message: 'Postingan tidak ditemukan' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data postingan', error });
  }
};

// POST /posts (Penulis dan Editor)
exports.createPost = async (req, res) => {
  try {
    const { title, content, status } = req.body;
    const post = await Post.create({
      title,
      content,
      status: status || 'draft',
      user_id: req.user.id
    });
    res.status(201).json({ message: 'Post created successfully!', post });
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat postingan', error });
  }
};

// PUT /posts/:id (Pemilik atau Editor)
exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Postingan tidak ditemukan' });

    if (post.user_id !== req.user.id && req.user.role !== 'editor') {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    await post.update(req.body);
    res.json({ message: 'Post updated successfully!', post });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengedit postingan', error });
  }
};

// DELETE /posts/:id (Pemilik atau Editor)
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Postingan tidak ditemukan' });

    if (post.user_id !== req.user.id && req.user.role !== 'editor') {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    await post.destroy();
    res.json({ message: 'Post deleted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus postingan', error });
  }
};
