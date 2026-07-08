require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Organization = require('./models/Organization');
const User = require('./models/User');
const Role = require('./models/Role');
const Employee = require('./models/Employee');

const seedAdiTech = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for AdiTech seeding');

    // 1. Resolve or Create AdiTech Organization
    let org = await Organization.findOne({ name: { $regex: new RegExp('^aditech$', 'i') } });
    if (!org) {
      let organizationId = 'ORG0001';
      const lastOrg = await Organization.findOne().sort({ organizationId: -1 });
      if (lastOrg) {
        const match = lastOrg.organizationId.match(/ORG(\d+)/);
        if (match) {
          const nextNumber = parseInt(match[1], 10) + 1;
          organizationId = `ORG${String(nextNumber).padStart(4, '0')}`;
        }
      }
      org = new Organization({
        organizationId,
        name: 'AdiTech',
        email: 'aditech@gmail.com',
        address: 'AdiTech India Core HQ',
        subscriptionPlan: 'Enterprise',
        status: 'Active'
      });
      await org.save();
      console.log('Created Organization: AdiTech');
    } else {
      console.log('Organization AdiTech already exists:', org._id);
    }

    // 2. Resolve Roles
    const allRoles = await Role.find();
    const rolesMap = {};
    allRoles.forEach(r => {
      rolesMap[r.name] = r._id;
    });

    const requiredRoles = [
      'Organization Admin', 'HR Manager', 'Manager', 
      'Team Lead', 'IT Administrator', 'Auditor', 
      'Finance', 'Employee'
    ];
    for (const rName of requiredRoles) {
      if (!rolesMap[rName]) {
        const newRole = await Role.findOneAndUpdate(
          { name: rName },
          { name: rName },
          { upsert: true, new: true }
        );
        rolesMap[rName] = newRole._id;
      }
    }

    // Helper to generate Employee ID
    const getNextEmployeeId = async () => {
      let employeeId = 'EMP0001';
      const lastEmployee = await Employee.findOne().sort({ employeeId: -1 });
      if (lastEmployee) {
        const match = lastEmployee.employeeId.match(/EMP(\d+)/);
        if (match) {
          const nextNumber = parseInt(match[1], 10) + 1;
          employeeId = `EMP${String(nextNumber).padStart(4, '0')}`;
        } else {
          const count = await Employee.countDocuments();
          employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
        }
      }
      return employeeId;
    };

    // Helper to seed a single user and employee profile
    const seedUserAndEmployee = async (uInfo) => {
      const emailLower = uInfo.email.toLowerCase();
      let user = await User.findOne({ $or: [{ email: emailLower }, { username: uInfo.username }] });
      
      const hashedPassword = await bcrypt.hash(uInfo.password, 10);
      if (!user) {
        user = new User({
          email: emailLower,
          username: uInfo.username,
          password: hashedPassword,
          role: rolesMap[uInfo.roleName],
          organization: org._id,
          orgId: org._id,
          mustChangePassword: false,
          isActive: true,
          status: 'Active'
        });
        await user.save();
        console.log(`Created User: ${uInfo.username} (${emailLower})`);
      } else {
        user.password = hashedPassword;
        user.organization = org._id;
        user.orgId = org._id;
        user.mustChangePassword = false;
        user.isActive = true;
        user.status = 'Active';
        user.role = rolesMap[uInfo.roleName];
        await user.save();
        console.log(`Updated User: ${uInfo.username} (${emailLower})`);
      }

      let employee = await Employee.findOne({ userRef: user._id });
      if (!employee) {
        const employeeId = await getNextEmployeeId();
        employee = new Employee({
          employeeId,
          firstName: uInfo.firstName,
          lastName: uInfo.lastName,
          email: emailLower,
          department: uInfo.department,
          designation: uInfo.designation,
          joiningDate: new Date(),
          userRef: user._id,
          status: 'Active'
        });
        await employee.save();
        console.log(`Created Employee: ${employeeId} for ${uInfo.username}`);
      } else {
        employee.firstName = uInfo.firstName;
        employee.lastName = uInfo.lastName;
        employee.email = emailLower;
        employee.department = uInfo.department;
        employee.designation = uInfo.designation;
        await employee.save();
        console.log(`Updated Employee: ${employee.employeeId} for ${uInfo.username}`);
      }

      user.employeeRef = employee._id;
      await user.save();

      return { user, employee };
    };

    // 3. Seed Base Org Users first (Admin, HR, IT, Auditor, Finance, Manager)
    const baseUsers = [
      {
        email: 'admin@aditech.com',
        username: 'aditech_admin',
        password: 'ewp@123',
        roleName: 'Organization Admin',
        firstName: 'AdiTech',
        lastName: 'Admin',
        department: 'Management',
        designation: 'Organization Admin'
      },
      {
        email: 'hr@aditech.com',
        username: 'aditech_hr',
        password: 'ewp@123',
        roleName: 'HR Manager',
        firstName: 'AdiTech',
        lastName: 'HR',
        department: 'HR',
        designation: 'HR Manager'
      },
      {
        email: 'it@aditech.com',
        username: 'aditech_it',
        password: 'ewp@123',
        roleName: 'IT Administrator',
        firstName: 'AdiTech',
        lastName: 'IT',
        department: 'IT',
        designation: 'IT Administrator'
      },
      {
        email: 'auditor@aditech.com',
        username: 'aditech_auditor',
        password: 'ewp@123',
        roleName: 'Auditor',
        firstName: 'AdiTech',
        lastName: 'Auditor',
        department: 'Security',
        designation: 'Auditor'
      },
      {
        email: 'finance@aditech.com',
        username: 'aditech_finance',
        password: 'ewp@123',
        roleName: 'Finance',
        firstName: 'AdiTech',
        lastName: 'Finance',
        department: 'Finance',
        designation: 'Finance Executive'
      },
      {
        email: 'manager@aditech.com',
        username: 'aditech_manager',
        password: 'ewp@123',
        roleName: 'Manager',
        firstName: 'AdiTech',
        lastName: 'Manager',
        department: 'Engineering',
        designation: 'Department Manager'
      }
    ];

    const seededBase = {};
    for (const u of baseUsers) {
      const res = await seedUserAndEmployee(u);
      seededBase[u.username] = res.employee;
    }

    const managerEmp = seededBase['aditech_manager'];

    // 4. Seed Team Leads and link them to Department Manager
    const teamLeads = [
      {
        email: 'lead@aditech.com',
        username: 'aditech_lead',
        password: 'ewp@123',
        roleName: 'Team Lead',
        firstName: 'AdiTech',
        lastName: 'Lead',
        department: 'Engineering',
        designation: 'Team Lead'
      },
      {
        email: 'lead2@aditech.com',
        username: 'aditech_lead2',
        password: 'ewp@123',
        roleName: 'Team Lead',
        firstName: 'AdiTech',
        lastName: 'LeadTwo',
        department: 'Engineering',
        designation: 'Team Lead'
      }
    ];

    const seededLeads = {};
    for (const tl of teamLeads) {
      const res = await seedUserAndEmployee(tl);
      res.employee.reportingManager = managerEmp._id;
      await res.employee.save();
      seededLeads[tl.username] = res.employee;
      console.log(`Assigned Manager (${managerEmp.firstName}) as supervisor for Team Lead ${tl.username}`);
    }

    const lead1Emp = seededLeads['aditech_lead'];
    const lead2Emp = seededLeads['aditech_lead2'];

    // 5. Seed 7 Employees and assign them to respective Team Leads
    const employeesToSeed = [
      {
        email: 'employee@aditech.com',
        username: 'aditech_employee',
        password: 'ewp@123',
        roleName: 'Employee',
        firstName: 'AdiTech',
        lastName: 'Employee',
        department: 'Engineering',
        designation: 'Software Engineer',
        lead: lead1Emp
      },
      {
        email: 'emp1@aditech.com',
        username: 'aditech_emp1',
        password: 'ewp@123',
        roleName: 'Employee',
        firstName: 'AdiTech',
        lastName: 'EmpOne',
        department: 'Engineering',
        designation: 'Frontend Engineer',
        lead: lead1Emp
      },
      {
        email: 'emp2@aditech.com',
        username: 'aditech_emp2',
        password: 'ewp@123',
        roleName: 'Employee',
        firstName: 'AdiTech',
        lastName: 'EmpTwo',
        department: 'Engineering',
        designation: 'Backend Engineer',
        lead: lead1Emp
      },
      {
        email: 'emp3@aditech.com',
        username: 'aditech_emp3',
        password: 'ewp@123',
        roleName: 'Employee',
        firstName: 'AdiTech',
        lastName: 'EmpThree',
        department: 'Engineering',
        designation: 'QA Automation Engineer',
        lead: lead1Emp
      },
      {
        email: 'emp4@aditech.com',
        username: 'aditech_emp4',
        password: 'ewp@123',
        roleName: 'Employee',
        firstName: 'AdiTech',
        lastName: 'EmpFour',
        department: 'Engineering',
        designation: 'React Native Dev',
        lead: lead2Emp
      },
      {
        email: 'emp5@aditech.com',
        username: 'aditech_emp5',
        password: 'ewp@123',
        roleName: 'Employee',
        firstName: 'AdiTech',
        lastName: 'EmpFive',
        department: 'Engineering',
        designation: 'DevOps Specialist',
        lead: lead2Emp
      },
      {
        email: 'emp6@aditech.com',
        username: 'aditech_emp6',
        password: 'ewp@123',
        roleName: 'Employee',
        firstName: 'AdiTech',
        lastName: 'EmpSix',
        department: 'Engineering',
        designation: 'Cloud Architect',
        lead: lead2Emp
      }
    ];

    for (const empInfo of employeesToSeed) {
      const res = await seedUserAndEmployee(empInfo);
      res.employee.reportingManager = empInfo.lead._id;
      await res.employee.save();
      console.log(`Assigned Team Lead (${empInfo.lead.firstName} ${empInfo.lead.lastName}) as supervisor for ${empInfo.username}`);
    }

    console.log('Seeding AdiTech complete. 1 Manager, 2 Team Leads, 7 Employees created and linked successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding AdiTech Error:', err);
    process.exit(1);
  }
};

seedAdiTech();
