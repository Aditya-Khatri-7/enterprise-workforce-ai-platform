require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Role = require('./models/Role');

const roles = [
  'Super Admin', 'Organization Admin', 'HR Manager', 
  'Manager', 'Team Lead', 'Employee', 'Finance', 
  'IT Administrator', 'Auditor'
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding');

    // Seed Roles
    for (const roleName of roles) {
      await Role.findOneAndUpdate(
        { name: roleName },
        { name: roleName },
        { upsert: true, new: true }
      );
    }
    console.log('Roles seeded successfully');

    // Seed Super Admin
    const superAdminRole = await Role.findOne({ name: 'Super Admin' });
    
    const adminEmail = 'admin@enterprise.com';
    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      const newAdmin = new User({
        email: adminEmail,
        username: 'superadmin',
        password: hashedPassword,
        role: superAdminRole._id,
        mustChangePassword: false
      });
      await newAdmin.save();
      console.log('Super Admin created: admin@enterprise.com / Admin@123');
    } else {
      console.log('Super Admin already exists.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedDB();
