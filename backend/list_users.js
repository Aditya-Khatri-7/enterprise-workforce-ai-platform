const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('Could not set custom DNS servers:', e);
}
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

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
