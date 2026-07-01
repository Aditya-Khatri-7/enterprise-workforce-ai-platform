require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');

async function listUsers() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find().populate('role');
  users.forEach(u => console.log(`Email: ${u.email}, Role: ${u.role ? u.role.name : 'None'}`));
  process.exit(0);
}
listUsers();
