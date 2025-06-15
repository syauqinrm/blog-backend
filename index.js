const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { createHandler } = require("graphql-http/lib/use/express");
const { sequelize } = require("./models");

// Set timezone to Asia/Jakarta
process.env.TZ = 'Asia/Jakarta';

// GraphQL imports
const schema = require("./graphql/schema");
const resolvers = require("./graphql/resolvers");
const createContext = require("./graphql/context");

// Load environment variables
dotenv.config();

// Middlewares
app.use(cors());
app.use(express.json());

// 🔐 Rate Limiting: max 100 requests per 15 menit per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100,
  message: {
    message: "Terlalu banyak permintaan dari IP ini, coba lagi nanti.",
  },
});
app.use(limiter);

// GraphQL endpoint
app.use(
  "/graphql",
  createHandler({
    schema: schema,
    rootValue: resolvers,
    context: async (req) => {
      return await createContext(req);
    },
    // Enable GraphiQL in development
    graphiql: process.env.NODE_ENV !== "production",
    // Format errors
    formatError: (error) => {
      console.error("GraphQL Error:", error);
      return {
        message: error.message,
        extensions: error.extensions,
        locations: error.locations,
        path: error.path,
      };
    },
  })
);

// REST API Routes (existing)
const apiRoutes = require("./routes");
app.use("/api/v1", apiRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Blog Backend API is running",
    endpoints: {
      rest: "/api/v1",
      graphql: "/graphql",
      graphiql: process.env.NODE_ENV !== "production" ? "/graphql" : "disabled",
    },
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

// Start server
const PORT = process.env.PORT || 3000;
sequelize
  .sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server ready at http://localhost:${PORT}`);
      console.log(`📊 REST API at http://localhost:${PORT}/api/v1`);
      console.log(`🎮 GraphQL at http://localhost:${PORT}/graphql`);
      if (process.env.NODE_ENV !== "production") {
        console.log(`🛝 GraphiQL at http://localhost:${PORT}/graphql`);
      }
    });
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });
