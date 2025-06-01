exports.transform = (comment) => ({
  id: comment.id,
  comment: comment.comment,
  userId: comment.user_id,
  postId: comment.post_id,
  createdAt: comment.createdAt,
});
