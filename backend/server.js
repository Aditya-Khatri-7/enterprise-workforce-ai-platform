require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employee');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // increased limit
  message: 'Too many requests from this IP, please try again later.',
  skip: () => process.env.NODE_ENV !== 'production', // disable rate limiting in development
});
app.use('/api', limiter);

// Built-in Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });
