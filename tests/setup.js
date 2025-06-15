const { sequelize } = require("../models");

beforeAll(async () => {
  // Sync database untuk testing
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Tutup koneksi database setelah semua test selesai
  await sequelize.close();
});

// Fungsi helper untuk membuat user test
global.createTestUser = async (userData = {}) => {
  const { User } = require("../models");
  const bcrypt = require("bcryptjs");

  const defaultData = {
    name: "Test User",
    email: "test@example.com",
    password: await bcrypt.hash("password123", 10),
    role: "penulis",
  };

  return await User.create({ ...defaultData, ...userData });
};

// Fungsi helper untuk generate JWT token
global.generateToken = (userId, role) => {
  const jwt = require("jsonwebtoken");
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET || "JWTs3cr3t",
    { expiresIn: "1d" }
  );
};
