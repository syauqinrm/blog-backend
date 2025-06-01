const { Post, User, Comment } = require('../models');

exports.getAllPosts = async () => {
  return await Post.findAll({ include: [User, Comment], order: [['createdAt', 'DESC']] });
};

exports.getPostById = async (id) => {
  return await Post.findByPk(id, { include: [User, Comment] });
};

exports.createPost = async ({ userId, title, content }) => {
  return await Post.create({ user_id: userId, title, content });
};

exports.updatePost = async (id, user, data) => {
  const post = await Post.findByPk(id);
  if (!post) throw { code: 404, message: 'Postingan tidak ditemukan' };

  if (post.user_id !== user.id && user.role !== 'editor') {
    throw { code: 403, message: 'Tidak memiliki izin untuk mengubah postingan ini' };
  }

  await post.update(data);
  return post;
};

exports.deletePost = async (id, user) => {
  const post = await Post.findByPk(id);
  if (!post) throw { code: 404, message: 'Postingan tidak ditemukan' };

  if (post.user_id !== user.id && user.role !== 'editor') {
    throw { code: 403, message: 'Tidak memiliki izin untuk menghapus postingan ini' };
  }

  await post.destroy();
  return 'Postingan berhasil dihapus';
};
