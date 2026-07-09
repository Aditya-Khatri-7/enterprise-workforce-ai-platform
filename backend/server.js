require('dotenv').config();
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('Could not set custom DNS servers:', e);
}
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
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
const officeLocationRoutes = require('./routes/officeLocation');
const recruitmentRoutes = require('./routes/recruitment');
const assetRoutes = require('./routes/asset');
const attendanceRoutes = require('./routes/attendance');
const aiRoutes = require('./routes/ai');
const notificationRoutes = require('./routes/notification');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middlewares
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
];

const corsOptionsDelegate = (req, callback) => {
  const origin = req.header('Origin');
  const host = req.header('Host');
  
  let isAllowed = false;
  if (!origin) {
    isAllowed = true;
  } else if (allowedOrigins.includes(origin)) {
    isAllowed = true;
  } else {
    const originHost = origin.replace(/^https?:\/\//, '').split(':')[0];
    const requestHost = host ? host.split(':')[0] : '';
    if (originHost === requestHost) {
      isAllowed = true;
    }
  }
  
  if (isAllowed) {
    callback(null, { origin: true, credentials: true });
  } else {
    callback(null, { origin: false });
  }
};

app.use(cors(corsOptionsDelegate));


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

// Serve frontend static assets FIRST (must be before all routes)
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  // Serve static files (JS, CSS, images) from the compiled frontend
  app.use(express.static(path.join(__dirname, '../frontend/dist'), {
    index: false // Don't auto-serve index.html - let the catch-all below handle it
  }));
}

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
app.use('/api/office-locations', officeLocationRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/teams', require('./routes/team'));
app.use('/api/progress-reports', require('./routes/progressReport'));
app.use('/api/objections', require('./routes/objection'));
app.use('/api/projects', require('./routes/project'));
app.use('/api/proposals', require('./routes/proposal'));
app.use('/api/requests', require('./routes/request'));
app.use('/api/grievances', require('./routes/grievance'));

// SPA Fallback: serve index.html for all non-API routes (React Router support)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const http = require('http');
const { initSocket } = require('./utils/socket');

const server = http.createServer(app);
initSocket(server);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error (continuing server boot):', error);
  });

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
// Nodemon connection force-reload comment 2
