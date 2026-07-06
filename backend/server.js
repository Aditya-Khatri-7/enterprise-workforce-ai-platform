require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employee');
const organizationRoutes = require('./routes/organization');
const userRoutes = require('./routes/user');
const auditRoutes = require('./routes/audit');
const departmentRoutes = require('./routes/department');
const leaveRoutes = require('./routes/leave');
const supportRoutes = require('./routes/support');
const designationRoutes = require('./routes/designation');
const policyRoutes = require('./routes/policy');
const workShiftRoutes = require('./routes/workShift');
const enterpriseRoutes = require('./routes/enterprise');
const recruitmentRoutes = require('./routes/recruitment');
const assetRoutes = require('./routes/asset');
const attendanceRoutes = require('./routes/attendance');
const aiRoutes = require('./routes/ai');
const notificationRoutes = require('./routes/notification');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middlewares
app.use(helmet());
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
app.use('/api/organizations', organizationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/designations', designationRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/workshifts', workShiftRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/requests', require('./routes/request'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error (continuing server boot):', error);
  });

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
