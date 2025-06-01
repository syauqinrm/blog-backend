exports.transform = (post) => ({
  id: post.id,
  title: post.title,
  content: post.content,
  status: post.status,
  author: post.User ? post.User.name : undefined,
  comments: post.Comments?.map(comment => ({
    id: comment.id,
    comment: comment.comment,
    user: comment.User ? comment.User.name : undefined,
  })) || [],
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
});
