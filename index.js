require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const authRoutes = require('./routes/authRoutes');

// middleware global
app.use(cors());
app.use(express.json());

// route prefix
app.use('/api/auth', authRoutes);

// contoh endpoint dasar
app.get('/', (req, res) => {
  res.send('Blog Backend API Aktif');
});

// error handling fallback
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
