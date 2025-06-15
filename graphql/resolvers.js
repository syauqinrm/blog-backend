const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { GraphQLError } = require("graphql");
const { User, Post, Comment } = require("../models");

// Helper function to generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role: role }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "1h",
  });
};

// Helper function to verify user ownership or editor role
const checkOwnershipOrEditor = (
  resourceUserId,
  currentUserId,
  currentUserRole
) => {
  if (resourceUserId !== currentUserId && currentUserRole !== "editor") {
    throw new GraphQLError("Tidak memiliki izin untuk mengakses resource ini", {
      extensions: { code: "FORBIDDEN" },
    });
  }
};

// Helper function to require authentication
const requireAuth = (user) => {
  if (!user) {
    throw new GraphQLError("Tidak terautentikasi", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
};

const resolvers = {
  // Query resolvers
  me: async ({}, { user }) => {
    requireAuth(user);
    return await User.findByPk(user.id);
  },

  users: async ({}, { user }) => {
    requireAuth(user);
    if (user.role !== "editor") {
      throw new GraphQLError("Akses ditolak", {
        extensions: { code: "FORBIDDEN" },
      });
    }
    return await User.findAll({
      order: [["createdAt", "DESC"]],
    });
  },

  user: async ({ id }) => {
    const foundUser = await User.findByPk(id);
    if (!foundUser) {
      throw new GraphQLError("User tidak ditemukan", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    return foundUser;
  },

  posts: async ({ limit = 10, offset = 0, status, userId }) => {
    const whereClause = {};
    if (status) whereClause.status = status;
    if (userId) whereClause.user_id = userId;

    const { count, rows } = await Post.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        { model: User, as: "user" },
        { model: Comment, as: "comments" },
      ],
    });

    return {
      posts: rows,
      totalCount: count,
      hasNextPage: offset + limit < count,
      hasPreviousPage: offset > 0,
    };
  },

  post: async ({ id }) => {
    const post = await Post.findByPk(id, {
      include: [
        { model: User, as: "user" },
        {
          model: Comment,
          as: "comments",
          include: [{ model: User, as: "user" }],
        },
      ],
    });
    if (!post) {
      throw new GraphQLError("Post tidak ditemukan", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    return post;
  },

  myPosts: async ({}, { user }) => {
    requireAuth(user);
    return await Post.findAll({
      where: { user_id: user.id },
      order: [["createdAt", "DESC"]],
      include: [{ model: Comment, as: "comments" }],
    });
  },

  comments: async ({ postId, limit = 10, offset = 0 }) => {
    const { count, rows } = await Comment.findAndCountAll({
      where: { post_id: postId },
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        { model: User, as: "user" },
        { model: Post, as: "post" },
      ],
    });

    return {
      comments: rows,
      totalCount: count,
    };
  },

  comment: async ({ id }) => {
    const comment = await Comment.findByPk(id, {
      include: [
        { model: User, as: "user" },
        { model: Post, as: "post" },
      ],
    });
    if (!comment) {
      throw new GraphQLError("Comment tidak ditemukan", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    return comment;
  },

  // Mutation resolvers
  register: async ({ input }) => {
    const { name, email, password, role } = input;

    // Validasi input
    if (!name || name.length < 2) {
      throw new GraphQLError("Nama minimal 2 karakter", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    if (!email || !email.includes("@")) {
      throw new GraphQLError("Email tidak valid", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    if (!password || password.length < 6) {
      throw new GraphQLError("Password minimal 6 karakter", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    // Validasi role
    if (role === "editor") {
      throw new GraphQLError(
        "Role editor tidak boleh dibuat melalui register",
        {
          extensions: { code: "FORBIDDEN" },
        }
      );
    }

    // Cek email sudah ada
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new GraphQLError("Email sudah digunakan", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Buat user baru
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "pembaca",
    });

    // Generate token
    const token = generateToken(user.id, user.role);

    return {
      accessToken: token,
      user,
      message: "Registrasi berhasil",
    };
  },

  login: async ({ input }) => {
    const { email, password } = input;

    // Validasi input
    if (!email || !password) {
      throw new GraphQLError("Email dan password wajib diisi", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    // Cari user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new GraphQLError("Email atau password salah", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    // Verifikasi password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new GraphQLError("Email atau password salah", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    return {
      accessToken: token,
      user,
      message: "Login berhasil",
    };
  },

  createPost: async ({ input }, { user }) => {
    requireAuth(user);

    if (user.role !== "penulis" && user.role !== "editor") {
      throw new GraphQLError("Akses ditolak. Role tidak diizinkan.", {
        extensions: { code: "FORBIDDEN" },
      });
    }

    const { title, content, status } = input;

    // Validasi input
    if (!title || title.length < 5) {
      throw new GraphQLError("Judul minimal 5 karakter", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    if (!content || content.length < 10) {
      throw new GraphQLError("Konten minimal 10 karakter", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    const post = await Post.create({
      title,
      content,
      status: status || "draft",
      user_id: user.id,
    });

    const createdPost = await Post.findByPk(post.id, {
      include: [{ model: User, as: "user" }],
    });

    return {
      post: createdPost,
      message: "Post berhasil dibuat!",
    };
  },

  updatePost: async ({ id, input }, { user }) => {
    requireAuth(user);

    const post = await Post.findByPk(id);
    if (!post) {
      throw new GraphQLError("Post tidak ditemukan", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    checkOwnershipOrEditor(post.user_id, user.id, user.role);

    await post.update(input);

    const updatedPost = await Post.findByPk(id, {
      include: [{ model: User, as: "user" }],
    });

    return {
      post: updatedPost,
      message: "Post berhasil diupdate!",
    };
  },

  deletePost: async ({ id }, { user }) => {
    requireAuth(user);

    const post = await Post.findByPk(id);
    if (!post) {
      throw new GraphQLError("Post tidak ditemukan", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    checkOwnershipOrEditor(post.user_id, user.id, user.role);

    await post.destroy();

    return {
      success: true,
      message: "Post berhasil dihapus",
    };
  },

  createComment: async ({ input }, { user }) => {
    requireAuth(user);

    const { postId, comment } = input;

    // Validasi input
    if (!comment || comment.length < 1) {
      throw new GraphQLError("Komentar wajib diisi", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    if (comment.length > 250) {
      throw new GraphQLError("Komentar maksimal 250 karakter", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    // Verifikasi post exists
    const post = await Post.findByPk(postId);
    if (!post) {
      throw new GraphQLError("Post tidak ditemukan", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    const newComment = await Comment.create({
      comment,
      post_id: postId,
      user_id: user.id,
    });

    const createdComment = await Comment.findByPk(newComment.id, {
      include: [
        { model: User, as: "user" },
        { model: Post, as: "post" },
      ],
    });

    return {
      comment: createdComment,
      message: "Komentar berhasil ditambahkan!",
    };
  },

  updateComment: async ({ id, input }, { user }) => {
    requireAuth(user);

    const comment = await Comment.findByPk(id);
    if (!comment) {
      throw new GraphQLError("Comment tidak ditemukan", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    checkOwnershipOrEditor(comment.user_id, user.id, user.role);

    await comment.update(input);

    const updatedComment = await Comment.findByPk(id, {
      include: [
        { model: User, as: "user" },
        { model: Post, as: "post" },
      ],
    });

    return {
      comment: updatedComment,
      message: "Komentar berhasil diupdate!",
    };
  },

  deleteComment: async ({ id }, { user }) => {
    requireAuth(user);

    const comment = await Comment.findByPk(id);
    if (!comment) {
      throw new GraphQLError("Comment tidak ditemukan", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    checkOwnershipOrEditor(comment.user_id, user.id, user.role);

    await comment.destroy();

    return {
      success: true,
      message: "Komentar berhasil dihapus",
    };
  },
};

module.exports = resolvers;
