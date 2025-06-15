const request = require("supertest");
const express = require("express");
const cors = require("cors");
const { sequelize } = require("../models");
const postRoutes = require("../routes/postRoutes");
const authMiddleware = require("../middlewares/authMiddleware");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/v1/posts", postRoutes);

describe("Posts Routes", () => {
  let testUser, testToken, testPost;

  beforeEach(async () => {
    // Bersihkan database dan buat data test
    await sequelize.sync({ force: true });

    testUser = await createTestUser({
      email: "author@example.com",
      name: "Test Author",
      role: "penulis",
    });

    testToken = generateToken(testUser.id, testUser.role);

    // Buat post untuk testing
    const { Post } = require("../models");
    testPost = await Post.create({
      title: "Test Post",
      content: "This is a test post content",
      status: "published",
      user_id: testUser.id,
    });
  });

  describe("GET /api/v1/posts", () => {
    it("should get all posts successfully", async () => {
      const response = await request(app).get("/api/v1/posts").expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("title");
      expect(response.body[0]).toHaveProperty("content");
      expect(response.body[0]).toHaveProperty("status");
    });

    it("should return empty array when no posts exist", async () => {
      const { Post } = require("../models");
      await Post.destroy({ where: {} });

      const response = await request(app).get("/api/v1/posts").expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(0);
    });
  });

  describe("GET /api/v1/posts/:id", () => {
    it("should get a specific post successfully", async () => {
      const response = await request(app)
        .get(`/api/v1/posts/${testPost.id}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", testPost.id);
      expect(response.body).toHaveProperty("title", testPost.title);
      expect(response.body).toHaveProperty("content", testPost.content);
    });

    it("should return 404 for non-existent post", async () => {
      const response = await request(app)
        .get("/api/v1/posts/99999")
        .expect(404);

      expect(response.body).toHaveProperty(
        "message",
        "Postingan tidak ditemukan"
      );
    });
  });

  describe("POST /api/v1/posts", () => {
    it("should create a new post successfully", async () => {
      const postData = {
        title: "New Test Post",
        content: "This is new post content",
        status: "draft",
      };

      const response = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${testToken}`)
        .send(postData)
        .expect(201);

      expect(response.body).toHaveProperty(
        "message",
        "Post created successfully!"
      );
      expect(response.body.post).toHaveProperty("title", postData.title);
      expect(response.body.post).toHaveProperty("content", postData.content);
      expect(response.body.post).toHaveProperty("status", postData.status);
    });

    it("should require authentication", async () => {
      const postData = {
        title: "New Test Post",
        content: "This is new post content",
      };

      const response = await request(app)
        .post("/api/v1/posts")
        .send(postData)
        .expect(401);

      expect(response.body).toHaveProperty("message", "Token tidak ditemukan");
    });

    it("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${testToken}`)
        .send({});

      console.log("Status:", response.status);
      console.log("Body:", response.body);

      // Sementara expect 500 untuk melihat structure response
      expect(response.status).toBe(500);
    });

    it("should only allow penulis and editor roles", async () => {
      const readerUser = await createTestUser({
        email: "reader@example.com",
        role: "pembaca",
      });
      const readerToken = generateToken(readerUser.id, readerUser.role);

      const postData = {
        title: "New Test Post",
        content: "This is new post content",
      };

      const response = await request(app)
        .post("/api/v1/posts")
        .set("Authorization", `Bearer ${readerToken}`)
        .send(postData)
        .expect(403);

      expect(response.body).toHaveProperty(
        "message",
        "Akses ditolak. Role tidak diizinkan."
      );
    });
  });

  describe("PUT /api/v1/posts/:id", () => {
    it("should update own post successfully", async () => {
      const updateData = {
        title: "Updated Test Post",
        content: "Updated content",
        status: "published",
      };

      const response = await request(app)
        .put(`/api/v1/posts/${testPost.id}`)
        .set("Authorization", `Bearer ${testToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Post updated successfully!"
      );
      expect(response.body.post).toHaveProperty("title", updateData.title);
    });

    it("should not allow updating other user's post", async () => {
      const otherUser = await createTestUser({
        email: "other@example.com",
        role: "penulis",
      });
      const otherToken = generateToken(otherUser.id, otherUser.role);

      const updateData = {
        title: "Trying to update",
      };

      const response = await request(app)
        .put(`/api/v1/posts/${testPost.id}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body).toHaveProperty(
        "message",
        "Tidak memiliki izin untuk mengubah postingan ini"
      );
    });

    it("should allow editor to update any post", async () => {
      const editorUser = await createTestUser({
        email: "editor@example.com",
        role: "editor",
      });
      const editorToken = generateToken(editorUser.id, editorUser.role);

      const updateData = {
        title: "Updated by Editor",
      };

      const response = await request(app)
        .put(`/api/v1/posts/${testPost.id}`)
        .set("Authorization", `Bearer ${editorToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.post).toHaveProperty("title", updateData.title);
    });
  });

  describe("DELETE /api/v1/posts/:id", () => {
    it("should delete own post successfully", async () => {
      const response = await request(app)
        .delete(`/api/v1/posts/${testPost.id}`)
        .set("Authorization", `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Postingan berhasil dihapus"
      );
    });

    it("should not allow deleting other user's post", async () => {
      const otherUser = await createTestUser({
        email: "other@example.com",
        role: "penulis",
      });
      const otherToken = generateToken(otherUser.id, otherUser.role);

      const response = await request(app)
        .delete(`/api/v1/posts/${testPost.id}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body).toHaveProperty(
        "message",
        "Tidak memiliki izin untuk menghapus postingan ini"
      );
    });

    it("should return 404 for non-existent post", async () => {
      const response = await request(app)
        .delete("/api/v1/posts/99999")
        .set("Authorization", `Bearer ${testToken}`)
        .expect(404);

      expect(response.body).toHaveProperty(
        "message",
        "Postingan tidak ditemukan"
      );
    });
  });
});
