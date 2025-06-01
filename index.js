const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./models');

// Load environment variables
dotenv.config();

// Middlewares
app.use(cors());
app.use(express.json());

// 🔐 Rate Limiting: max 100 requests per 15 menit per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100,
  message: { message: 'Terlalu banyak permintaan dari IP ini, coba lagi nanti.' },
});
app.use(limiter);

// API Routes (Versioning)
const apiRoutes = require('./routes');
app.use('/api/v1', apiRoutes); // ⬅️ versioned route prefix

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Blog Backend API is running' });
});

// Error handling (optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 3000;
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Unable to connect to the database:', err);
});
