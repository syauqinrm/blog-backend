const { Comment } = require('../models');

exports.createComment = async ({ userId, postId, content }) => {
  return await Comment.create({ user_id: userId, post_id: postId, comment: content });
};

exports.deleteComment = async (id, user) => {
  const comment = await Comment.findByPk(id);
  if (!comment) throw { code: 404, message: 'Komentar tidak ditemukan' };

  if (comment.user_id !== user.id && user.role !== 'editor') {
    throw { code: 403, message: 'Tidak memiliki izin untuk menghapus komentar ini' };
  }

  await comment.destroy();
  return 'Komentar berhasil dihapus';
};
