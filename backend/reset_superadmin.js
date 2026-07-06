require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

async function resetSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    const result = await User.updateOne(
      { email: 'admin@enterprise.com' },
      { 
        $set: { 
          password: hashedPassword, 
          mustChangePassword: false, 
          isLocked: false, 
          failedLoginAttempts: 0,
          isActive: true,
          status: 'Active'
        } 
      }
    );

    console.log('Super Admin password reset successfully to: Admin@123', result);
    process.exit(0);
  } catch (error) {
    console.error('Reset error:', error);
    process.exit(1);
  }
}

resetSuperAdmin();
