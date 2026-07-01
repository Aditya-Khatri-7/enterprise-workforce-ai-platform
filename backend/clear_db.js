require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');

async function clearDB() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Keep admin@enterprise.com and orgadmin@enterprise.com
  const deleteUsersResult = await User.deleteMany({
    email: { $nin: ['admin@enterprise.com', 'orgadmin@enterprise.com'] }
  });
  
  const deleteEmployeesResult = await Employee.deleteMany({});
  
  console.log(`Deleted ${deleteUsersResult.deletedCount} old users and ${deleteEmployeesResult.deletedCount} old employees.`);
  process.exit(0);
}
clearDB();
