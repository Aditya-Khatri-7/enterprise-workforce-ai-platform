require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Role = require('./models/Role'); // Explicitly register role schema

const verifyLogins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to database to verify logins');

    const testUsers = [
      'admin@aditech.com',
      'hr@aditech.com',
      'manager@aditech.com',
      'lead@aditech.com',
      'lead2@aditech.com',
      'employee@aditech.com',
      'emp1@aditech.com',
      'emp2@aditech.com',
      'emp3@aditech.com',
      'emp4@aditech.com',
      'emp5@aditech.com',
      'emp6@aditech.com'
    ];

    console.log('\n--- VERIFYING LOGINS (Password: ewp@123) ---');
    let failures = 0;

    for (const email of testUsers) {
      const user = await User.findOne({ email: email.toLowerCase() }).populate('role');
      if (!user) {
        console.error(`❌ User NOT found in database: ${email}`);
        failures++;
        continue;
      }

      const match = await bcrypt.compare('ewp@123', user.password);
      if (match) {
        console.log(`✅ Login Success: ${email} (Role: ${user.role?.name || 'Unassigned'})`);
      } else {
        console.error(`❌ Password mismatch for: ${email}`);
        failures++;
      }
    }

    console.log('\n-------------------------------------------');
    if (failures === 0) {
      console.log('🎉 ALL seeded logins verified successfully! No failures.');
      process.exit(0);
    } else {
      console.error(`⚠️ Verification finished with ${failures} failure(s).`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Error verifying logins:', err);
    process.exit(1);
  }
};

verifyLogins();
