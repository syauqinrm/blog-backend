const postService = require('../services/postService');
const postTransformer = require('../transformers/postTransformer');

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await postService.getAllPosts();
    res.json(posts.map(postTransformer.transform));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await postService.getPostById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Postingan tidak ditemukan' });
    }
    res.json(postTransformer.transform(post));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    const post = await postService.createPost({
      userId: req.user.id,
      ...req.body,
    });
    res.status(201).json({
      message: 'Post created successfully!',
      post: postTransformer.transform(post),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await postService.updatePost(req.params.id, req.user, req.body);
    res.json({ message: 'Post updated successfully!', post: postTransformer.transform(post) });
  } catch (error) {
    res.status(error.code || 500).json({ message: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const result = await postService.deletePost(req.params.id, req.user);
    res.json({ message: result });
  } catch (error) {
    res.status(error.code || 500).json({ message: error.message });
  }
};
