const request = require("supertest");
const express = require("express");
const cors = require("cors");
const { sequelize } = require("../models");
const authRoutes = require("../routes/authRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/v1/auth", authRoutes);

describe("Auth Routes", () => {
  beforeEach(async () => {
    // Bersihkan database sebelum setiap test
    await sequelize.sync({ force: true });
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "penulis",
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty("message", "Registrasi berhasil");
      expect(response.body.user).toHaveProperty("email", userData.email);
      expect(response.body.user).toHaveProperty("name", userData.name);
      expect(response.body.user).toHaveProperty("role", userData.role);
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should not allow registration with editor role", async () => {
      const userData = {
        name: "Editor User",
        email: "editor@example.com",
        password: "password123",
        role: "editor",
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(403);

      expect(response.body).toHaveProperty(
        "message",
        "Role editor tidak boleh dibuat melalui register"
      );
    });

    it("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toBeInstanceOf(Array);
    });

    it("should not allow duplicate email", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "penulis",
      };

      // Registrasi pertama
      await request(app)
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(201);

      // Registrasi kedua dengan email sama
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("message", "Email sudah digunakan");
    });

    it("should validate email format", async () => {
      const userData = {
        name: "John Doe",
        email: "invalid-email",
        password: "password123",
        role: "penulis",
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: "Email tidak valid",
          }),
        ])
      );
    });

    it("should validate password length", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "123",
        role: "penulis",
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: "Password minimal 6 karakter",
          }),
        ])
      );
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      // Buat user untuk testing login
      await createTestUser({
        email: "test@example.com",
        name: "Test User",
        role: "penulis",
      });
    });

    it("should login successfully with valid credentials", async () => {
      const loginData = {
        email: "test@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty("accessToken");
      expect(typeof response.body.accessToken).toBe("string");
    });

    it("should reject login with invalid email", async () => {
      const loginData = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty(
        "message",
        "Email atau password salah"
      );
    });

    it("should reject login with invalid password", async () => {
      const loginData = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty(
        "message",
        "Email atau password salah"
      );
    });

    it("should validate required fields", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors).toBeInstanceOf(Array);
    });

    it("should validate email format", async () => {
      const loginData = {
        email: "invalid-email",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(400);

      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: "Email tidak valid",
          }),
        ])
      );
    });
  });
});
