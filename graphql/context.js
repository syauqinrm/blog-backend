const jwt = require("jsonwebtoken");
const { User } = require("../models");

const createContext = async (req) => {
  let user = null;

  // Extract token from headers
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");

    try {
      // Verify and decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user in database
      user = await User.findByPk(decoded.id);

      if (!user) {
        console.log("User tidak ditemukan untuk token yang diberikan");
      }
    } catch (error) {
      console.error("Token verification failed:", error.message);
      // Don't throw error here, just set user to null
      // This allows unauthenticated queries to work
    }
  }

  return {
    user,
    isAuthenticated: !!user,
  };
};

module.exports = createContext;
