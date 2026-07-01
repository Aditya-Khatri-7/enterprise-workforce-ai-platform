require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

async function resetPwd() {
  await mongoose.connect(process.env.MONGO_URI);
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  const result = await User.updateOne(
    { email: 'orgadmin@enterprise.com' },
    { $set: { password: hashedPassword, isActive: true, isLocked: false, failedLoginAttempts: 0 } }
  );
  console.log('Org Admin password reset to Admin@123', result);
  process.exit(0);
}
resetPwd();
