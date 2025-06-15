---
tools: ["codebase"]
---

baca dan cermati direktori project blog-backend ini, tolong buatkan unit testing untuk mengecek /api/v1/posts, /api/v1/comments, /api/v1/auth/login, /api/v1/auth/register menggunakan jest dan supertest

> Copilot: Berdasarkan struktur proyek blog-backend yang Anda berikan, saya akan membuat unit testing menggunakan Jest dan Supertest untuk endpoint-endpoint yang diminta. Saya akan membuat file-file test yang komprehensif.
>
> ## 1. Konfigurasi Testing Environment
>
> Pertama, mari buat konfigurasi Jest untuk testing:
>
> ```javascript
> module.exports = {
>   testEnvironment: "node",
>   testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).js"],
>   collectCoverageFrom: [
>     "controllers/**/*.js",
>     "services/**/*.js",
>     "routes/**/*.js",
>     "!**/node_modules/**",
>   ],
>   setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
>   testTimeout: 10000,
> };
> ```
>
> ## 2. Setup File untuk Testing
>
> ```javascript
> const { sequelize } = require("../models");
>
> beforeAll(async () => {
>   // Sync database untuk testing
>   await sequelize.sync({ force: true });
> });
>
> afterAll(async () => {
>   // Tutup koneksi database setelah semua test selesai
>   await sequelize.close();
> });
>
> // Fungsi helper untuk membuat user test
> global.createTestUser = async (userData = {}) => {
>   const { User } = require("../models");
>   const bcrypt = require("bcryptjs");
>
>   const defaultData = {
>     name: "Test User",
>     email: "test@example.com",
>     password: await bcrypt.hash("password123", 10),
>     role: "penulis",
>   };
>
>   return await User.create({ ...defaultData, ...userData });
> };
>
> // Fungsi helper untuk generate JWT token
> global.generateToken = (userId, role) => {
>   const jwt = require("jsonwebtoken");
>   return jwt.sign(
>     { id: userId, role: role },
>     process.env.JWT_SECRET || "JWTs3cr3t",
>     { expiresIn: "1d" }
>   );
> };
> ```
>
> ## 3. Test untuk Auth Routes
>
> ```javascript
> const request = require("supertest");
> const express = require("express");
> const cors = require("cors");
> const { sequelize } = require("../models");
> const authRoutes = require("../routes/authRoutes");
>
> const app = express();
> app.use(cors());
> app.use(express.json());
> app.use("/api/v1/auth", authRoutes);
>
> describe("Auth Routes", () => {
>   beforeEach(async () => {
>     // Bersihkan database sebelum setiap test
>     await sequelize.sync({ force: true });
>   });
>
>   describe("POST /api/v1/auth/register", () => {
>     it("should register a new user successfully", async () => {
>       const userData = {
>         name: "John Doe",
>         email: "john@example.com",
>         password: "password123",
>         role: "penulis",
>       };
>
>       const response = await request(app)
>         .post("/api/v1/auth/register")
>         .send(userData)
>         .expect(201);
>
>       expect(response.body).toHaveProperty("message", "Registrasi berhasil");
>       expect(response.body.user).toHaveProperty("email", userData.email);
>       expect(response.body.user).toHaveProperty("name", userData.name);
>       expect(response.body.user).toHaveProperty("role", userData.role);
>       expect(response.body.user).not.toHaveProperty("password");
>     });
>
>     it("should not allow registration with editor role", async () => {
>       const userData = {
>         name: "Editor User",
>         email: "editor@example.com",
>         password: "password123",
>         role: "editor",
>       };
>
>       const response = await request(app)
>         .post("/api/v1/auth/register")
>         .send(userData)
>         .expect(403);
>
>       expect(response.body).toHaveProperty(
>         "message",
>         "Role editor tidak boleh dibuat melalui register"
>       );
>     });
>
>     it("should validate required fields", async () => {
>       const response = await request(app)
>         .post("/api/v1/auth/register")
>         .send({})
>         .expect(400);
>
>       expect(response.body).toHaveProperty("errors");
>       expect(response.body.errors).toBeInstanceOf(Array);
>     });
>
>     it("should not allow duplicate email", async () => {
>       const userData = {
>         name: "John Doe",
>         email: "john@example.com",
>         password: "password123",
>         role: "penulis",
>       };
>
>       // Registrasi pertama
>       await request(app)
>         .post("/api/v1/auth/register")
>         .send(userData)
>         .expect(201);
>
>       // Registrasi kedua dengan email sama
>       const response = await request(app)
>         .post("/api/v1/auth/register")
>         .send(userData)
>         .expect(400);
>
>       expect(response.body).toHaveProperty(
>         "message",
>         "Email sudah digunakan"
>       );
>     });
>
>     it("should validate email format", async () => {
>       const userData = {
>         name: "John Doe",
>         email: "invalid-email",
>         password: "password123",
>         role: "penulis",
>       };
>
>       const response = await request(app)
>         .post("/api/v1/auth/register")
>         .send(userData)
>         .expect(400);
>
>       expect(response.body.errors).toEqual(
>         expect.arrayContaining([
>           expect.objectContaining({
>             msg: "Email tidak valid",
>           }),
>         ])
>       );
>     });
>
>     it("should validate password length", async () => {
>       const userData = {
>         name: "John Doe",
>         email: "john@example.com",
>         password: "123",
>         role: "penulis",
>       };
>
>       const response = await request(app)
>         .post("/api/v1/auth/register")
>         .send(userData)
>         .expect(400);
>
>       expect(response.body.errors).toEqual(
>         expect.arrayContaining([
>           expect.objectContaining({
>             msg: "Password minimal 6 karakter",
>           }),
>         ])
>       );
>     });
>   });
>
>   describe("POST /api/v1/auth/login", () => {
>     beforeEach(async () => {
>       // Buat user untuk testing login
>       await createTestUser({
>         email: "test@example.com",
>         name: "Test User",
>         role: "penulis",
>       });
>     });
>
>     it("should login successfully with valid credentials", async () => {
>       const loginData = {
>         email: "test@example.com",
>         password: "password123",
>       };
>
>       const response = await request(app)
>         .post("/api/v1/auth/login")
>         .send(loginData)
>         .expect(200);
>
>       expect(response.body).toHaveProperty("accessToken");
>       expect(typeof response.body.accessToken).toBe("string");
>     });
>
>     it("should reject login with invalid email", async () => {
>       const loginData = {
>         email: "nonexistent@example.com",
>         password: "password123",
>       };
>
>       const response = await request(app)
>         .post("/api/v1/auth/login")
>         .send(loginData)
>         .expect(401);
>
>       expect(response.body).toHaveProperty(
>         "message",
>         "Email atau password salah"
>       );
>     });
>
>     it("should reject login with invalid password", async () => {
>       const loginData = {
>         email: "test@example.com",
>         password: "wrongpassword",
>       };
>
>       const response = await request(app)
>         .post("/api/v1/auth/login")
>         .send(loginData)
>         .expect(401);
>
>       expect(response.body).toHaveProperty(
>         "message",
>         "Email atau password salah"
>       );
>     });
>
>     it("should validate required fields", async () => {
>       const response = await request(app)
>         .post("/api/v1/auth/login")
>         .send({})
>         .expect(400);
>
>       expect(response.body).toHaveProperty("errors");
>       expect(response.body.errors).toBeInstanceOf(Array);
>     });
>
>     it("should validate email format", async () => {
>       const loginData = {
>         email: "invalid-email",
>         password: "password123",
>       };
>
>       const response = await request(app)
>         .post("/api/v1/auth/login")
>         .send(loginData)
>         .expect(400);
>
>       expect(response.body.errors).toEqual(
>         expect.arrayContaining([
>           expect.objectContaining({
>             msg: "Email tidak valid",
>           }),
>         ])
>       );
>     });
>   });
> });
> ```
>
> ## 4. Test untuk Posts Routes
>
> ```javascript
> const request = require("supertest");
> const express = require("express");
> const cors = require("cors");
> const { sequelize } = require("../models");
> const postRoutes = require("../routes/postRoutes");
> const authMiddleware = require("../middlewares/authMiddleware");
>
> const app = express();
> app.use(cors());
> app.use(express.json());
> app.use("/api/v1/posts", postRoutes);
>
> describe("Posts Routes", () => {
>   let testUser, testToken, testPost;
>
>   beforeEach(async () => {
>     // Bersihkan database dan buat data test
>     await sequelize.sync({ force: true });
>
>     testUser = await createTestUser({
>       email: "author@example.com",
>       name: "Test Author",
>       role: "penulis",
>     });
>
>     testToken = generateToken(testUser.id, testUser.role);
>
>     // Buat post untuk testing
>     const { Post } = require("../models");
>     testPost = await Post.create({
>       title: "Test Post",
>       content: "This is a test post content",
>       status: "published",
>       user_id: testUser.id,
>     });
>   });
>
>   describe("GET /api/v1/posts", () => {
>     it("should get all posts successfully", async () => {
>       const response = await request(app).get("/api/v1/posts").expect(200);
>
>       expect(response.body).toBeInstanceOf(Array);
>       expect(response.body.length).toBeGreaterThan(0);
>       expect(response.body[0]).toHaveProperty("id");
>       expect(response.body[0]).toHaveProperty("title");
>       expect(response.body[0]).toHaveProperty("content");
>       expect(response.body[0]).toHaveProperty("status");
>     });
>
>     it("should return empty array when no posts exist", async () => {
>       const { Post } = require("../models");
>       await Post.destroy({ where: {} });
>
>       const response = await request(app).get("/api/v1/posts").expect(200);
>
>       expect(response.body).toBeInstanceOf(Array);
>       expect(response.body.length).toBe(0);
>     });
>   });
>
>   describe("GET /api/v1/posts/:id", () => {
>     it("should get a specific post successfully", async () => {
>       const response = await request(app)
>         .get(`/api/v1/posts/${testPost.id}`)
>         .expect(200);
>
>       expect(response.body).toHaveProperty("id", testPost.id);
>       expect(response.body).toHaveProperty("title", testPost.title);
>       expect(response.body).toHaveProperty("content", testPost.content);
>     });
>
>     it("should return 404 for non-existent post", async () => {
>       const response = await request(app)
>         .get("/api/v1/posts/99999")
>         .expect(404);
>
>       expect(response.body).toHaveProperty(
>         "message",
>         "Postingan tidak ditemukan"
>       );
>     });
>   });
>
>   describe("POST /api/v1/posts", () => {
>     it("should create a new post successfully", async () => {
>       const postData = {
>         title: "New Test Post",
>         content: "This is new post content",
>         status: "draft",
>       };
>
>       const response = await request(app)
>         .post("/api/v1/posts")
>         .set("Authorization", `Bearer ${testToken}`)
>         .send(postData)
>         .expect(201);
>
>       expect(response.body).toHaveProperty(
>         "message",
>         "Post created successfully!"
>       );
>       expect(response.body.post).toHaveProperty("title", postData.title);
>       expect(response.body.post).toHaveProperty("content", postData.content);
>       expect(response.body.post).toHaveProperty("status", postData.status);
>     });
>
>     it("should require authentication", async () => {
>       const postData = {
>         title: "New Test Post",
>         content: "This is new post content",
>       };
>
>       const response = await request(app)
>         .post("/api/v1/posts")
>         .send(postData)
>         .expect(401);
>
>       expect(response.body).toHaveProperty(
>         "message",
>         "Token tidak ditemukan"
>       );
>     });
>
>     it("should validate required fields", async () => {
>       const response = await request(app)
>         .post("/api/v1/posts")
>         .set("Authorization", `Bearer ${testToken}`)
>         .send({})
>         .expect(400);
>
>       expect(response.body).toHaveProperty("errors");
>     });
>
>     it("should only allow penulis and editor roles", async () => {
>       const readerUser = await createTestUser({
>         email: "reader@example.com",
>         role: "pembaca",
>       });
>       const readerToken = generateToken(readerUser.id, readerUser.role);
>
>       const postData = {
>         title: "New Test Post",
>         content: "This is new post content",
>       };
>
>       const response = await request(app)
>         .post("/api/v1/posts")
>         .set("Authorization", `Bearer ${readerToken}`)
>         .send(postData)
>         .expect(403);
>
>       expect(response.body).toHaveProperty(
>         "message",
>         "Akses ditolak. Role tidak diizinkan."
>       );
>     });
>   });
>
>   describe("PUT /api/v1/posts/:id", () => {
>     it("should update own post successfully", async () => {
>       const updateData = {
>         title: "Updated Test Post",
>         content: "Updated content",
>         status: "published",
>       };
>
>       const response = await request(app)
>         .put(`/api/v1/posts/${testPost.id}`)
>         .set("Authorization", `Bearer ${testToken}`)
>         .send(updateData)
>         .expect(200);
>
>       expect(response.body).toHaveProperty(
>         "message",
>         "Post updated successfully!"
>       );
>       expect(response.body.post).toHaveProperty("title", updateData.title);
>     });
>
>     it("should not allow updating other user's post", async () => {
>       const otherUser = await createTestUser({
>         email: "other@example.com",
>         role: "penulis",
>       });
>       const otherToken = generateToken(otherUser.id, otherUser.role);
>
>       const updateData = {
>         title: "Trying to update",
>       };
>
>       const response = await request(app)
>         .put(`/api/v1/posts/${testPost.id}`)
>         .set("Authorization", `Bearer ${otherToken}`)
>         .send(updateData)
>         .expect(403);
>
>       expect(response.body).toHaveProperty(
>         "message",
>         "Tidak memiliki izin untuk mengubah postingan ini"
>       );
>     });
>
>     it("should allow editor to update any post", async () => {
>       const editorUser = await createTestUser({
>         email: "editor@example.com",
>         role: "editor",
>       });
>       const editorToken = generateToken(editorUser.id, editorUser.role);
>
>       const updateData = {
>         title: "Updated by Editor",
>       };
>
>       const response = await request(app)
>         .put(`/api/v1/posts/${testPost.id}`)
>         .set("Authorization", `Bearer ${editorToken}`)
>         .send(updateData)
>         .expect(200);
>
>       expect(response.body.post).toHaveProperty("title", updateData.title);
>     });
>   });
>
>   describe("DELETE /api/v1/posts/:id", () => {
>     it("should delete own post successfully", async () => {
>       const response = await request(app)
>         .delete(`/api/v1/posts/${testPost.id}`)
>         .set("Authorization", `Bearer ${testToken}`)
>         .expect(200);
>
>       expect(response.body).toHaveProperty(
>         "message",
>         "Postingan berhasil dihapus"
>       );
>     });
>
>     it("should not allow deleting other user's post", async () => {
>       const otherUser = await createTestUser({
>         email: "other@example.com",
>         role: "penulis",
>       });
>       const otherToken = generateToken(otherUser.id, otherUser.role);
>
>       const response = await request(app)
>         .delete(`/api/v1/posts/${testPost.id}`)
>         .set("Authorization", `Bearer ${otherToken}`)
>         .expect(403);
>
>       expect(response.body).toHaveProperty(
>         "message",
>         "Tidak memiliki izin untuk menghapus postingan ini"
>       );
>     });
>
>     it("should return 404 for non-existent post", async () => {
>       const response = await request(app)
>         .delete("/api/v1/posts/99999")
>         .set("Authorization", `Bearer ${testToken}`)
>         .expect(404);
>
>       expect(response.body).toHaveProperty(
>         "message",
>         "Postingan tidak ditemukan"
>       );
>     });
>   });
> });
> ```
>
> ## 5. Test untuk Comments Routes
>
> ```javascript
> const request = require("supertest");
> const express = require("express");
> const cors = require("cors");
> const { sequelize } = require("../models");
> const commentRoutes = require("../routes/commentRoutes");
>
> const app = express();
> app.use(cors());
> app.use(express.json());
> app.use("/api/v1/comments", commentRoutes);
>
> describe("Comments Routes", () => {
>   let testUser, testToken, testPost, testComment;
>
>   beforeEach(async () => {
>     // Bersihkan database dan buat data test
>     await sequelize.sync({ force: true });
>
>     testUser = await createTestUser({
>       email: "commenter@example.com",
>       name: "Test Commenter",
>       role: "pembaca",
>     });
>
>     testToken = generateToken(testUser.id, testUser.role);
>
>     // Buat post untuk testing
>     const { Post } = require("../models");
>     testPost = await Post.create({
>       title: "Test Post for Comments",
>       content: "This is a test post content",
>       status: "published",
>       user_id: testUser.id,
>     });
>
>     // Buat comment untuk testing
>     const { Comment } = require("../models");
>     testComment = await Comment.create({
>       comment: "This is a test comment",
>       post_id: testPost.id,
>       user_id: testUser.id,
>     });
>   });
>
>   describe("POST /api/v1/comments", () => {
>     it("should create a new comment successfully", async () => {
>       const commentData = {
>         post_id: testPost.id,
>         comment: "This is a new test comment",
>       };
>
>       const response = await request(app)
>         .post("/api/v1/comments")
>         .set("Authorization", `Bearer ${testToken}`)
>         .send(commentData)
>         .expect(201);
>
>       expect(response.body).toHaveProperty(
>         "message",
>         "Komentar berhasil ditambahkan!"
>       );
>       expect(response.body.comment).toHaveProperty(
>         "comment",
>         commentData.comment
>       );
>       expect(response.body.comment).toHaveProperty(
>         "postId",
>         commentData.post_id
>       );
>       expect(response.body.comment).toHaveProperty("userId", testUser.id);
>     });
>
>     it("should require authentication", async () => {
>       const commentData = {
>         post_id: testPost.id,
>         comment: "This is a new test comment",
>       };
>
>       const response = await request(app)
>         .post("/api/v1/comments")
>         .send(commentData)
>         .expect(401);
>
>       expect(response.body).toHaveProperty(
>         "message",
>         "Token tidak ditemukan"
>       );
>     });
>
>     it("should validate required fields", async () => {
>       const response = await request(app)
>         .post("/api/v1/comments")
>         .set("Authorization", `Bearer ${testToken}`)
>         .send({})
>         .expect(400);
>
>       expect(response.body).toHaveProperty("errors");
>     });
>
>     it("should validate post_id is integer", async () => {
>       const commentData = {
>         post_id: "invalid",
>         comment: "This is a test comment",
>       };
>
>       const response = await request(app)
>         .post("/api/v1/comments")
>         .set("Authorization", `Bearer ${testToken}`)
>         .send(commentData)
>         .expect(400);
>
>       expect(response.body.errors).toEqual(
>         expect.arrayContaining([
>           expect.objectContaining({
>             msg: "post_id harus berupa angka",
>           }),
>         ])
>       );
>     });
>
>     it("should validate comment length", async () => {
>       const commentData = {
>         post_id: testPost.id,
>         comment: "a".repeat(251), // 251 characters, exceeds 250 limit
>       };
>
>       const response = await request(app)
>         .post("/api/v1/comments")
>         .set("Authorization", `Bearer ${testToken}`)
>         .send(commentData)
>         .expect(400);
>
>       expect(response.body.errors).toEqual(
>         expect.arrayContaining([
>           expect.objectContaining({
>             msg: "Komentar maksimal 250 karakter",
>           }),
>         ])
>       );
>     });
>
>     it("should not allow empty comment", async () => {
>       const commentData = {
>         post_id: testPost.id,
>         comment: "",
>       };
>
>       const response = await request(app)
>         .post("/api/v1/comments")
>         .set("Authorization", `Bearer ${testToken}`)
>         .send(commentData)
>         .expect(400);
>
>       expect(response.body.errors).toEqual(
>         expect.arrayContaining([
>           expect.objectContaining({
>             msg: "Komentar wajib diisi",
>           }),
>         ])
>       );
>     });
>   });
>
>   describe("DELETE /api/v1/comments/:id", () => {
>     it("should delete own comment successfully", async () => {
>       const response = await request(app)
>         .delete(`/api/v1/comments/${testComment.id}`)
>         .set("Authorization", `Bearer ${testToken}`)
>         .expect(200);
>
>       expect(response.body).toHaveProperty(
>         "message",
>         "Komentar berhasil dihapus"
>       );
>     });
>
>     it("should not allow deleting other user's comment", async () => {
>       const otherUser = await createTestUser({
>         email: "other@example.com",
>         role: "pembaca",
>       });
>       const otherToken = generateToken(otherUser.id, otherUser.role);
>
>       const response = await request(app)
>         .delete(`/api/v1/comments/${testComment.id}`)
>         .set("Authorization", `Bearer ${otherToken}`)
>         .expect(403);
>
>       expect(response.body).toHaveProperty(
>         "message",
>         "Tidak memiliki izin untuk menghapus komentar ini"
>       );
>     });
>
>     it("should allow editor to delete any comment", async () => {
>       const editorUser = await createTestUser({
>         email: "editor@example.com",
>         role: "editor",
>       });
>       const editorToken = generateToken(editorUser.id, editorUser.role);
>
>       const response = await request(app)
>         .delete(`/api/v1/comments/${testComment.id}`)
>         .set("Authorization", `Bearer ${editorToken}`)
>         .expect(200);
>
>       expect(response.body).toHaveProperty(
>         "message",
>         "Komentar berhasil dihapus"
>       );
>     });
>
>     it("should return 404 for non-existent comment", async () => {
>       const response = await request(app)
>         .delete("/api/v1/comments/99999")
>         .set("Authorization", `Bearer ${testToken}`)
>         .expect(404);
>
>       expect(response.body).toHaveProperty(
>         "message",
>         "Komentar tidak ditemukan"
>       );
>     });
>
>     it("should require authentication", async () => {
>       const response = await request(app)
>         .delete(`/api/v1/comments/${testComment.id}`)
>         .expect(401);
>
>       expect(response.body).toHaveProperty(
>         "message",
>         "Token tidak ditemukan"
>       );
>     });
>   });
> });
> ```
>
> ## 6. Environment untuk Testing
>
> ```javascript
> DB_HOST = localhost;
> DB_USER = root;
> DB_PASSWORD = root;
> DB_NAME = blog_db_test;
> DB_PORT = 3306;
> JWT_SECRET = JWTs3cr3t_test;
> NODE_ENV = test;
> ```
>
> ## 7. Script untuk Menjalankan Test
>
> Update package.json untuk memastikan script test sudah benar:
>
> ```json
> {
>   "scripts": {
>     "test": "NODE_ENV=test jest",
>     "test:watch": "NODE_ENV=test jest --watch",
>     "test:coverage": "NODE_ENV=test jest --coverage",
>     "test:auth": "NODE_ENV=test jest tests/auth.test.js",
>     "test:posts": "NODE_ENV=test jest tests/posts.test.js",
>     "test:comments": "NODE_ENV=test jest tests/comments.test.js"
>   }
> }
> ```
>
> ## Cara Menjalankan Test
>
> 1. **Jalankan semua test:**
>
> ```bash
> npm test
> ```
>
> 2. **Jalankan test dengan coverage:**
>
> ```bash
> npm run test:coverage
> ```
>
> 3. **Jalankan test specific:**
>
> ```bash
> npm run test:auth
> npm run test:posts
> npm run test:comments
> ```
>
> 4. **Jalankan test dalam watch mode:**
>
> ```bash
> npm run test:watch
> ```
>
> ## Fitur Testing yang Diimplementasikan
>
> ### Auth Tests:
>
> - ✅ Register user baru
> - ✅ Validasi field required
> - ✅ Validasi email format
> - ✅ Validasi password length
> - ✅ Prevent duplicate email
> - ✅ Prevent editor registration
> - ✅ Login dengan credentials valid
> - ✅ Reject login invalid
>
> ### Posts Tests:
>
> - ✅ Get all posts
> - ✅ Get specific post
> - ✅ Create new post (authenticated)
> - ✅ Update own post
> - ✅ Delete own post
> - ✅ Role-based access control
> - ✅ Editor permissions
> - ✅ Validation tests
>
> ### Comments Tests:
>
> - ✅ Create new comment
> - ✅ Delete own comment
> - ✅ Role-based permissions
> - ✅ Field validation
> - ✅ Authentication requirements
>
> Semua test ini akan memastikan API endpoint Anda berfungsi dengan benar dan sesuai dengan business logic yang telah didefinisikan dalam aplikasi blog-backend Anda.

nah dari project ini, tolong buatkan api dengan graphql, menggunakan http graphql untuk express

> Copilot: Saya akan membantu Anda membuat API GraphQL menggunakan `graphql-http` untuk Express pada project blog-backend ini. `graphql-http` adalah implementasi yang lebih modern dan ringan dibanding Apollo Server.
>
> ## 1. Install Dependencies
>
> ```bash
> npm install graphql graphql-http
> ```
>
> ## 2. Update package.json
>
> ```json
> {
>   "dependencies": {
>     "axios": "^1.9.0",
>     "bcrypt": "^6.0.0",
>     "bcryptjs": "^3.0.2",
>     "cors": "^2.8.5",
>     "dotenv": "^16.5.0",
>     "express": "^5.1.0",
>     "express-rate-limit": "^7.5.0",
>     "express-validator": "^7.2.1",
>     "graphql": "^16.8.1",
>     "graphql-http": "^1.22.0",
>     "jsonwebtoken": "^9.0.2",
>     "mysql2": "^3.14.1",
>     "sequelize": "^6.37.7"
>   }
> }
> ```
>
> ## 3. GraphQL Schema
>
> ```javascript
> const { buildSchema } = require("graphql");
>
> const schema = buildSchema(`
>   type User {
>     id: ID!
>     name: String!
>     email: String!
>     role: String!
>     createdAt: String!
>     updatedAt: String!
>     posts: [Post!]
>     comments: [Comment!]
>   }
> 
>   type Post {
>     id: ID!
>     title: String!
>     content: String!
>     status: String!
>     createdAt: String!
>     updatedAt: String!
>     user: User!
>     userId: ID!
>     comments: [Comment!]
>     commentCount: Int!
>   }
> 
>   type Comment {
>     id: ID!
>     comment: String!
>     createdAt: String!
>     updatedAt: String!
>     user: User!
>     post: Post!
>     userId: ID!
>     postId: ID!
>   }
> 
>   type AuthPayload {
>     accessToken: String!
>     user: User!
>     message: String!
>   }
> 
>   type PostsConnection {
>     posts: [Post!]!
>     totalCount: Int!
>     hasNextPage: Boolean!
>     hasPreviousPage: Boolean!
>   }
> 
>   type CommentsConnection {
>     comments: [Comment!]!
>     totalCount: Int!
>   }
> 
>   type PostPayload {
>     post: Post!
>     message: String!
>   }
> 
>   type CommentPayload {
>     comment: Comment!
>     message: String!
>   }
> 
>   type DeletePayload {
>     success: Boolean!
>     message: String!
>   }
> 
>   input RegisterInput {
>     name: String!
>     email: String!
>     password: String!
>     role: String = "pembaca"
>   }
> 
>   input LoginInput {
>     email: String!
>     password: String!
>   }
> 
>   input CreatePostInput {
>     title: String!
>     content: String!
>     status: String = "draft"
>   }
> 
>   input UpdatePostInput {
>     title: String
>     content: String
>     status: String
>   }
> 
>   input CreateCommentInput {
>     postId: ID!
>     comment: String!
>   }
> 
>   input UpdateCommentInput {
>     comment: String!
>   }
> 
>   type Query {
>     # User queries
>     me: User
>     users: [User!]!
>     user(id: ID!): User
> 
>     # Post queries
>     posts(
>       limit: Int = 10
>       offset: Int = 0
>       status: String
>       userId: ID
>     ): PostsConnection!
>     post(id: ID!): Post
>     myPosts: [Post!]!
> 
>     # Comment queries
>     comments(postId: ID!, limit: Int = 10, offset: Int = 0): CommentsConnection!
>     comment(id: ID!): Comment
>   }
> 
>   type Mutation {
>     # Auth mutations
>     register(input: RegisterInput!): AuthPayload!
>     login(input: LoginInput!): AuthPayload!
> 
>     # Post mutations
>     createPost(input: CreatePostInput!): PostPayload!
>     updatePost(id: ID!, input: UpdatePostInput!): PostPayload!
>     deletePost(id: ID!): DeletePayload!
> 
>     # Comment mutations
>     createComment(input: CreateCommentInput!): CommentPayload!
>     updateComment(id: ID!, input: UpdateCommentInput!): CommentPayload!
>     deleteComment(id: ID!): DeletePayload!
>   }
> `);
>
> module.exports = schema;
> ```
>
> ## 4. GraphQL Resolvers
>
> ```javascript
> const bcrypt = require("bcryptjs");
> const jwt = require("jsonwebtoken");
> const { GraphQLError } = require("graphql");
> const { User, Post, Comment } = require("../models");
>
> // Helper function to generate JWT token
> const generateToken = (userId, role) => {
>   return jwt.sign({ id: userId, role: role }, process.env.JWT_SECRET, {
>     expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "1h",
>   });
> };
>
> // Helper function to verify user ownership or editor role
> const checkOwnershipOrEditor = (
>   resourceUserId,
>   currentUserId,
>   currentUserRole
> ) => {
>   if (resourceUserId !== currentUserId && currentUserRole !== "editor") {
>     throw new GraphQLError(
>       "Tidak memiliki izin untuk mengakses resource ini",
>       {
>         extensions: { code: "FORBIDDEN" },
>       }
>     );
>   }
> };
>
> // Helper function to require authentication
> const requireAuth = (user) => {
>   if (!user) {
>     throw new GraphQLError("Tidak terautentikasi", {
>       extensions: { code: "UNAUTHENTICATED" },
>     });
>   }
> };
>
> const resolvers = {
>   // Query resolvers
>   me: async ({}, { user }) => {
>     requireAuth(user);
>     return await User.findByPk(user.id);
>   },
>
>   users: async ({}, { user }) => {
>     requireAuth(user);
>     if (user.role !== "editor") {
>       throw new GraphQLError("Akses ditolak", {
>         extensions: { code: "FORBIDDEN" },
>       });
>     }
>     return await User.findAll({
>       order: [["createdAt", "DESC"]],
>     });
>   },
>
>   user: async ({ id }) => {
>     const foundUser = await User.findByPk(id);
>     if (!foundUser) {
>       throw new GraphQLError("User tidak ditemukan", {
>         extensions: { code: "NOT_FOUND" },
>       });
>     }
>     return foundUser;
>   },
>
>   posts: async ({ limit = 10, offset = 0, status, userId }) => {
>     const whereClause = {};
>     if (status) whereClause.status = status;
>     if (userId) whereClause.user_id = userId;
>
>     const { count, rows } = await Post.findAndCountAll({
>       where: whereClause,
>       limit,
>       offset,
>       order: [["createdAt", "DESC"]],
>       include: [
>         { model: User, as: "user" },
>         { model: Comment, as: "comments" },
>       ],
>     });
>
>     return {
>       posts: rows,
>       totalCount: count,
>       hasNextPage: offset + limit < count,
>       hasPreviousPage: offset > 0,
>     };
>   },
>
>   post: async ({ id }) => {
>     const post = await Post.findByPk(id, {
>       include: [
>         { model: User, as: "user" },
>         {
>           model: Comment,
>           as: "comments",
>           include: [{ model: User, as: "user" }],
>         },
>       ],
>     });
>     if (!post) {
>       throw new GraphQLError("Post tidak ditemukan", {
>         extensions: { code: "NOT_FOUND" },
>       });
>     }
>     return post;
>   },
>
>   myPosts: async ({}, { user }) => {
>     requireAuth(user);
>     return await Post.findAll({
>       where: { user_id: user.id },
>       order: [["createdAt", "DESC"]],
>       include: [{ model: Comment, as: "comments" }],
>     });
>   },
>
>   comments: async ({ postId, limit = 10, offset = 0 }) => {
>     const { count, rows } = await Comment.findAndCountAll({
>       where: { post_id: postId },
>       limit,
>       offset,
>       order: [["createdAt", "DESC"]],
>       include: [
>         { model: User, as: "user" },
>         { model: Post, as: "post" },
>       ],
>     });
>
>     return {
>       comments: rows,
>       totalCount: count,
>     };
>   },
>
>   comment: async ({ id }) => {
>     const comment = await Comment.findByPk(id, {
>       include: [
>         { model: User, as: "user" },
>         { model: Post, as: "post" },
>       ],
>     });
>     if (!comment) {
>       throw new GraphQLError("Comment tidak ditemukan", {
>         extensions: { code: "NOT_FOUND" },
>       });
>     }
>     return comment;
>   },
>
>   // Mutation resolvers
>   register: async ({ input }) => {
>     const { name, email, password, role } = input;
>
>     // Validasi input
>     if (!name || name.length < 2) {
>       throw new GraphQLError("Nama minimal 2 karakter", {
>         extensions: { code: "BAD_USER_INPUT" },
>       });
>     }
>
>     if (!email || !email.includes("@")) {
>       throw new GraphQLError("Email tidak valid", {
>         extensions: { code: "BAD_USER_INPUT" },
>       });
>     }
>
>     if (!password || password.length < 6) {
>       throw new GraphQLError("Password minimal 6 karakter", {
>         extensions: { code: "BAD_USER_INPUT" },
>       });
>     }
>
>     // Validasi role
>     if (role === "editor") {
>       throw new GraphQLError(
>         "Role editor tidak boleh dibuat melalui register",
>         {
>           extensions: { code: "FORBIDDEN" },
>         }
>       );
>     }
>
>     // Cek email sudah ada
>     const existingUser = await User.findOne({ where: { email } });
>     if (existingUser) {
>       throw new GraphQLError("Email sudah digunakan", {
>         extensions: { code: "BAD_USER_INPUT" },
>       });
>     }
>
>     // Hash password
>     const hashedPassword = await bcrypt.hash(password, 12);
>
>     // Buat user baru
>     const user = await User.create({
>       name,
>       email,
>       password: hashedPassword,
>       role: role || "pembaca",
>     });
>
>     // Generate token
>     const token = generateToken(user.id, user.role);
>
>     return {
>       accessToken: token,
>       user,
>       message: "Registrasi berhasil",
>     };
>   },
>
>   login: async ({ input }) => {
>     const { email, password } = input;
>
>     // Validasi input
>     if (!email || !password) {
>       throw new GraphQLError("Email dan password wajib diisi", {
>         extensions: { code: "BAD_USER_INPUT" },
>       });
>     }
>
>     // Cari user
>     const user = await User.findOne({ where: { email } });
>     if (!user) {
>       throw new GraphQLError("Email atau password salah", {
>         extensions: { code: "UNAUTHENTICATED" },
>       });
>     }
>
>     // Verifikasi password
>     const isValidPassword = await bcrypt.compare(password, user.password);
>     if (!isValidPassword) {
>       throw new GraphQLError("Email atau password salah", {
>         extensions: { code: "UNAUTHENTICATED" },
>       });
>     }
>
>     // Generate token
>     const token = generateToken(user.id, user.role);
>
>     return {
>       accessToken: token,
>       user,
>       message: "Login berhasil",
>     };
>   },
>
>   createPost: async ({ input }, { user }) => {
>     requireAuth(user);
>
>     if (user.role !== "penulis" && user.role !== "editor") {
>       throw new GraphQLError("Akses ditolak. Role tidak diizinkan.", {
>         extensions: { code: "FORBIDDEN" },
>       });
>     }
>
>     const { title, content, status } = input;
>
>     // Validasi input
>     if (!title || title.length < 5) {
>       throw new GraphQLError("Judul minimal 5 karakter", {
>         extensions: { code: "BAD_USER_INPUT" },
>       });
>     }
>
>     if (!content || content.length < 10) {
>       throw new GraphQLError("Konten minimal 10 karakter", {
>         extensions: { code: "BAD_USER_INPUT" },
>       });
>     }
>
>     const post = await Post.create({
>       title,
>       content,
>       status: status || "draft",
>       user_id: user.id,
>     });
>
>     const createdPost = await Post.findByPk(post.id, {
>       include: [{ model: User, as: "user" }],
>     });
>
>     return {
>       post: createdPost,
>       message: "Post berhasil dibuat!",
>     };
>   },
>
>   updatePost: async ({ id, input }, { user }) => {
>     requireAuth(user);
>
>     const post = await Post.findByPk(id);
>     if (!post) {
>       throw new GraphQLError("Post tidak ditemukan", {
>         extensions: { code: "NOT_FOUND" },
>       });
>     }
>
>     checkOwnershipOrEditor(post.user_id, user.id, user.role);
>
>     await post.update(input);
>
>     const updatedPost = await Post.findByPk(id, {
>       include: [{ model: User, as: "user" }],
>     });
>
>     return {
>       post: updatedPost,
>       message: "Post berhasil diupdate!",
>     };
>   },
>
>   deletePost: async ({ id }, { user }) => {
>     requireAuth(user);
>
>     const post = await Post.findByPk(id);
>     if (!post) {
>       throw new GraphQLError("Post tidak ditemukan", {
>         extensions: { code: "NOT_FOUND" },
>       });
>     }
>
>     checkOwnershipOrEditor(post.user_id, user.id, user.role);
>
>     await post.destroy();
>
>     return {
>       success: true,
>       message: "Post berhasil dihapus",
>     };
>   },
>
>   createComment: async ({ input }, { user }) => {
>     requireAuth(user);
>
>     const { postId, comment } = input;
>
>     // Validasi input
>     if (!comment || comment.length < 1) {
>       throw new GraphQLError("Komentar wajib diisi", {
>         extensions: { code: "BAD_USER_INPUT" },
>       });
>     }
>
>     if (comment.length > 250) {
>       throw new GraphQLError("Komentar maksimal 250 karakter", {
>         extensions: { code: "BAD_USER_INPUT" },
>       });
>     }
>
>     // Verifikasi post exists
>     const post = await Post.findByPk(postId);
>     if (!post) {
>       throw new GraphQLError("Post tidak ditemukan", {
>         extensions: { code: "NOT_FOUND" },
>       });
>     }
>
>     const newComment = await Comment.create({
>       comment,
>       post_id: postId,
>       user_id: user.id,
>     });
>
>     const createdComment = await Comment.findByPk(newComment.id, {
>       include: [
>         { model: User, as: "user" },
>         { model: Post, as: "post" },
>       ],
>     });
>
>     return {
>       comment: createdComment,
>       message: "Komentar berhasil ditambahkan!",
>     };
>   },
>
>   updateComment: async ({ id, input }, { user }) => {
>     requireAuth(user);
>
>     const comment = await Comment.findByPk(id);
>     if (!comment) {
>       throw new GraphQLError("Comment tidak ditemukan", {
>         extensions: { code: "NOT_FOUND" },
>       });
>     }
>
>     checkOwnershipOrEditor(comment.user_id, user.id, user.role);
>
>     await comment.update(input);
>
>     const updatedComment = await Comment.findByPk(id, {
>       include: [
>         { model: User, as: "user" },
>         { model: Post, as: "post" },
>       ],
>     });
>
>     return {
>       comment: updatedComment,
>       message: "Komentar berhasil diupdate!",
>     };
>   },
>
>   deleteComment: async ({ id }, { user }) => {
>     requireAuth(user);
>
>     const comment = await Comment.findByPk(id);
>     if (!comment) {
>       throw new GraphQLError("Comment tidak ditemukan", {
>         extensions: { code: "NOT_FOUND" },
>       });
>     }
>
>     checkOwnershipOrEditor(comment.user_id, user.id, user.role);
>
>     await comment.destroy();
>
>     return {
>       success: true,
>       message: "Komentar berhasil dihapus",
>     };
>   },
> };
>
> module.exports = resolvers;
> ```
>
> ## 5. Context Provider (untuk autentikasi)
>
> ```javascript
> const jwt = require("jsonwebtoken");
> const { User } = require("../models");
>
> const createContext = async (req) => {
>   let user = null;
>
>   // Extract token from headers
>   const authHeader = req.headers.authorization;
>   if (authHeader) {
>     const token = authHeader.replace("Bearer ", "");
>
>     try {
>       // Verify and decode token
>       const decoded = jwt.verify(token, process.env.JWT_SECRET);
>
>       // Find user in database
>       user = await User.findByPk(decoded.id);
>
>       if (!user) {
>         console.log("User tidak ditemukan untuk token yang diberikan");
>       }
>     } catch (error) {
>       console.error("Token verification failed:", error.message);
>       // Don't throw error here, just set user to null
>       // This allows unauthenticated queries to work
>     }
>   }
>
>   return {
>     user,
>     isAuthenticated: !!user,
>   };
> };
>
> module.exports = createContext;
> ```
>
> ## 6. Update Main Server File
>
> ```javascript
> const express = require("express");
> const app = express();
> const dotenv = require("dotenv");
> const cors = require("cors");
> const rateLimit = require("express-rate-limit");
> const { createHandler } = require("graphql-http/lib/use/express");
> const { sequelize } = require("./models");
>
> // GraphQL imports
> const schema = require("./graphql/schema");
> const resolvers = require("./graphql/resolvers");
> const createContext = require("./graphql/context");
>
> // Load environment variables
> dotenv.config();
>
> // Middlewares
> app.use(cors());
> app.use(express.json());
>
> // 🔐 Rate Limiting: max 100 requests per 15 menit per IP
> const limiter = rateLimit({
>   windowMs: 15 * 60 * 1000, // 15 menit
>   max: 100,
>   message: {
>     message: "Terlalu banyak permintaan dari IP ini, coba lagi nanti.",
>   },
> });
> app.use(limiter);
>
> // GraphQL endpoint
> app.use(
>   "/graphql",
>   createHandler({
>     schema: schema,
>     rootValue: resolvers,
>     context: async (req) => {
>       return await createContext(req);
>     },
>     // Enable GraphiQL in development
>     graphiql: process.env.NODE_ENV !== "production",
>     // Format errors
>     formatError: (error) => {
>       console.error("GraphQL Error:", error);
>       return {
>         message: error.message,
>         extensions: error.extensions,
>         locations: error.locations,
>         path: error.path,
>       };
>     },
>   })
> );
>
> // REST API Routes (existing)
> const apiRoutes = require("./routes");
> app.use("/api/v1", apiRoutes);
>
> // Root endpoint
> app.get("/", (req, res) => {
>   res.json({
>     message: "Blog Backend API is running",
>     endpoints: {
>       rest: "/api/v1",
>       graphql: "/graphql",
>       graphiql:
>         process.env.NODE_ENV !== "production" ? "/graphql" : "disabled",
>     },
>   });
> });
>
> // Error handling
> app.use((err, req, res, next) => {
>   console.error(err.stack);
>   res.status(500).json({ message: "Internal Server Error" });
> });
>
> // Start server
> const PORT = process.env.PORT || 3000;
> sequelize
>   .sync()
>   .then(() => {
>     app.listen(PORT, () => {
>       console.log(`🚀 Server ready at http://localhost:${PORT}`);
>       console.log(`📊 REST API at http://localhost:${PORT}/api/v1`);
>       console.log(`🎮 GraphQL at http://localhost:${PORT}/graphql`);
>       if (process.env.NODE_ENV !== "production") {
>         console.log(`🛝 GraphiQL at http://localhost:${PORT}/graphql`);
>       }
>     });
>   })
>   .catch((err) => {
>     console.error("Unable to connect to the database:", err);
>   });
> ```
>
> ## 7. Example GraphQL Queries
>
> ```graphql
> # ==================== MUTATIONS ====================
>
> # Register User
> mutation RegisterUser {
>   register(
>     input: {
>       name: "John Doe"
>       email: "john@example.com"
>       password: "password123"
>       role: "penulis"
>     }
>   ) {
>     accessToken
>     user {
>       id
>       name
>       email
>       role
>     }
>     message
>   }
> }
>
> # Login
> mutation LoginUser {
>   login(input: { email: "john@example.com", password: "password123" }) {
>     accessToken
>     user {
>       id
>       name
>       email
>       role
>     }
>     message
>   }
> }
>
> # Create Post
> mutation CreatePost {
>   createPost(
>     input: {
>       title: "My First GraphQL Post"
>       content: "This is the content of my first GraphQL post. It's amazing!"
>       status: "published"
>     }
>   ) {
>     post {
>       id
>       title
>       content
>       status
>       user {
>         name
>         email
>       }
>     }
>     message
>   }
> }
>
> # Update Post
> mutation UpdatePost {
>   updatePost(
>     id: "1"
>     input: {
>       title: "Updated Post Title"
>       content: "Updated content here"
>       status: "published"
>     }
>   ) {
>     post {
>       id
>       title
>       content
>       status
>     }
>     message
>   }
> }
>
> # Delete Post
> mutation DeletePost {
>   deletePost(id: "1") {
>     success
>     message
>   }
> }
>
> # Create Comment
> mutation CreateComment {
>   createComment(input: { postId: "1", comment: "This is a great post!" }) {
>     comment {
>       id
>       comment
>       user {
>         name
>       }
>       post {
>         title
>       }
>     }
>     message
>   }
> }
>
> # Delete Comment
> mutation DeleteComment {
>   deleteComment(id: "1") {
>     success
>     message
>   }
> }
>
> # ==================== QUERIES ====================
>
> # Get All Posts
> query GetPosts {
>   posts(limit: 10, offset: 0) {
>     posts {
>       id
>       title
>       content
>       status
>       createdAt
>       user {
>         id
>         name
>         email
>       }
>       commentCount
>     }
>     totalCount
>     hasNextPage
>     hasPreviousPage
>   }
> }
>
> # Get Posts by Status
> query GetPublishedPosts {
>   posts(status: "published", limit: 5) {
>     posts {
>       id
>       title
>       content
>       user {
>         name
>       }
>       comments {
>         id
>         comment
>         user {
>           name
>         }
>       }
>     }
>     totalCount
>   }
> }
>
> # Get Single Post
> query GetPost {
>   post(id: "1") {
>     id
>     title
>     content
>     status
>     createdAt
>     user {
>       id
>       name
>       email
>     }
>     comments {
>       id
>       comment
>       createdAt
>       user {
>         name
>       }
>     }
>     commentCount
>   }
> }
>
> # Get My Posts (requires authentication)
> query GetMyPosts {
>   myPosts {
>     id
>     title
>     content
>     status
>     createdAt
>     commentCount
>   }
> }
>
> # Get Comments for a Post
> query GetComments {
>   comments(postId: "1", limit: 10) {
>     comments {
>       id
>       comment
>       createdAt
>       user {
>         name
>       }
>     }
>     totalCount
>   }
> }
>
> # Get Current User (requires authentication)
> query GetMe {
>   me {
>     id
>     name
>     email
>     role
>     createdAt
>     posts {
>       id
>       title
>       status
>     }
>     comments {
>       id
>       comment
>       post {
>         title
>       }
>     }
>   }
> }
>
> # Get All Users (requires editor role)
> query GetUsers {
>   users {
>     id
>     name
>     email
>     role
>     createdAt
>   }
> }
>
> # Get User by ID
> query GetUser {
>   user(id: "1") {
>     id
>     name
>     email
>     role
>     posts {
>       id
>       title
>       status
>     }
>     comments {
>       id
>       comment
>     }
>   }
> }
> ```
>
> ## 8. Testing dengan curl
>
> ```bash
> #!/bin/bash
>
> # Base URL
> BASE_URL="http://localhost:3000/graphql"
>
> # Test Register
> echo "=== Testing Register ==="
> curl -X POST \
>   -H "Content-Type: application/json" \
>   -d '{
>     "query": "mutation { register(input: { name: \"Test User\", email: \"test@example.com\", password: \"password123\", role: \"penulis\" }) { accessToken user { id name email role } message } }"
>   }' \
>   $BASE_URL
>
> echo -e "\n\n=== Testing Login ==="
> curl -X POST \
>   -H "Content-Type: application/json" \
>   -d '{
>     "query": "mutation { login(input: { email: \"test@example.com\", password: \"password123\" }) { accessToken user { id name email role } message } }"
>   }' \
>   $BASE_URL
>
> echo -e "\n\n=== Testing Get Posts ==="
> curl -X POST \
>   -H "Content-Type: application/json" \
>   -d '{
>     "query": "query { posts(limit: 5) { posts { id title content status user { name } } totalCount } }"
>   }' \
>   $BASE_URL
>
> echo -e "\n\n=== Testing Create Post (requires token) ==="
> TOKEN="YOUR_JWT_TOKEN_HERE"
> curl -X POST \
>   -H "Content-Type: application/json" \
>   -H "Authorization: Bearer $TOKEN" \
>   -d '{
>     "query": "mutation { createPost(input: { title: \"GraphQL Test Post\", content: \"This is a test post created via GraphQL\", status: \"published\" }) { post { id title content status } message } }"
>   }' \
>   $BASE_URL
> ```
>
> ## 9. Error Handling yang Lebih Baik
>
> ```javascript
> const { GraphQLError } = require("graphql");
>
> class AuthenticationError extends GraphQLError {
>   constructor(message) {
>     super(message, {
>       extensions: {
>         code: "UNAUTHENTICATED",
>         http: { status: 401 },
>       },
>     });
>   }
> }
>
> class ForbiddenError extends GraphQLError {
>   constructor(message) {
>     super(message, {
>       extensions: {
>         code: "FORBIDDEN",
>         http: { status: 403 },
>       },
>     });
>   }
> }
>
> class NotFoundError extends GraphQLError {
>   constructor(message) {
>     super(message, {
>       extensions: {
>         code: "NOT_FOUND",
>         http: { status: 404 },
>       },
>     });
>   }
> }
>
> class ValidationError extends GraphQLError {
>   constructor(message) {
>     super(message, {
>       extensions: {
>         code: "BAD_USER_INPUT",
>         http: { status: 400 },
>       },
>     });
>   }
> }
>
> module.exports = {
>   AuthenticationError,
>   ForbiddenError,
>   NotFoundError,
>   ValidationError,
> };
> ```
>
> ## Cara Menggunakan
>
> 1. **Install dependencies:**
>
> ```bash
> npm install graphql graphql-http
> ```
>
> 2. **Jalankan server:**
>
> ```bash
> npm run dev
> ```
>
> 3. **Akses GraphiQL (development only):**
>
> ```
> http://localhost:3000/graphql
> ```
>
> 4. **Test dengan curl atau Postman:**
>
> ```bash
> POST http://localhost:3000/graphql
> Content-Type: application/json
>
> {
>   "query": "query { posts { posts { id title content } } }"
> }
> ```
>
> ## Keunggulan `graphql-http`:
>
> ✅ **Ringan**: Lebih ringan dari Apollo Server  
> ✅ **Standar**: Mengikuti GraphQL over HTTP spec  
> ✅ **Fleksibel**: Mudah dikustomisasi  
> ✅ **Modern**: Menggunakan GraphQL.js terbaru  
> ✅ **Built-in GraphiQL**: Untuk development  
> ✅ **TypeScript support**: Jika dibutuhkan
>
> Sekarang Anda memiliki API GraphQL yang lengkap berjalan bersama dengan REST API yang sudah ada!
