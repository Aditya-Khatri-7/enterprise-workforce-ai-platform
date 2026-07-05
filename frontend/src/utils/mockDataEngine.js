let isInitialized = false;

// Dynamic In-memory Datastore
let organizations = [];
let users = [];
let employees = [];
let departments = [];
let designShifts = [];
let auditLogs = [];
let requests = [];
let leaves = [];
let tickets = [];
let recruitmentJobs = [];
let recruitmentCandidates = [];
let clockInState = null;
let expenses = [];
let sprintTasks = [];
let teamMembers = [];

function initializeData() {
  if (isInitialized) return;

  // 1. Organizations
  organizations = [
    { _id: 'org1', name: 'TechNova Global Pvt Ltd', code: 'TECHNOVA', status: 'Active', adminUser: 'admin1', address: 'Bangalore Core HQ', createdAt: new Date() },
    { _id: 'org2', name: 'NovaSoft Solutions', code: 'NOVASOFT', status: 'Active', adminUser: 'admin2', address: 'San Francisco Hub', createdAt: new Date() }
  ];

  // 2. Users
  users = [
    { _id: 'u1', username: 'superadmin', role: { name: 'Super Admin' }, isActive: true, email: 'superadmin@technova.com' },
    { _id: 'u2', username: 'orgadmin', role: { name: 'Organization Admin' }, isActive: true, email: 'admin@technova.com' },
    { _id: 'u3', username: 'hr_manager', role: { name: 'HR Manager' }, isActive: true, email: 'hr@technova.com' },
    { _id: 'u4', username: 'dept_manager', role: { name: 'Manager' }, isActive: true, email: 'manager@technova.com' },
    { _id: 'u5', username: 'team_lead', role: { name: 'Team Lead' }, isActive: true, email: 'lead@technova.com' },
    { _id: 'u6', username: 'employee_user', role: { name: 'Employee' }, isActive: true, email: 'staff@technova.com' },
    { _id: 'u7', username: 'finance_exec', role: { name: 'Finance' }, isActive: true, email: 'finance@technova.com' },
    { _id: 'u8', username: 'it_admin', role: { name: 'IT Administrator' }, isActive: true, email: 'it@technova.com' },
    { _id: 'u9', username: 'auditor_user', role: { name: 'Auditor' }, isActive: true, email: 'auditor@technova.com' }
  ];

  // 3. Departments
  departments = [
    { _id: 'd1', name: 'Research & Development', code: 'RD', status: 'Active' },
    { _id: 'd2', name: 'Operations & Scaling', code: 'OPS', status: 'Active' },
    { _id: 'd3', name: 'Finance & Accounts', code: 'FIN', status: 'Active' },
    { _id: 'd4', name: 'Human Resources', code: 'HR', status: 'Active' },
    { _id: 'd5', name: 'Customer Success', code: 'CS', status: 'Active' }
  ];

  // 4. Employees
  employees = [
    { _id: 'emp1', firstName: 'Elena', lastName: 'Rostova', email: 'elena.rostova@technova.com', employeeId: 'EMP1001', phone: '+1 415-321-4455', department: 'Research & Development', designation: 'Lead DevOps Architect', userRef: users[1], status: 'Active' },
    { _id: 'emp2', firstName: 'Marcus', lastName: 'Vane', email: 'marcus.vane@technova.com', employeeId: 'EMP1002', phone: '+1 415-321-4456', department: 'Operations & Scaling', designation: 'Chief Info Security Officer', userRef: users[2], status: 'Active' },
    { _id: 'emp3', firstName: 'Sarah', lastName: 'Jenkins', email: 'sarah.jenkins@technova.com', employeeId: 'EMP1003', phone: '+1 415-321-4457', department: 'Human Resources', designation: 'VP of People Operations', userRef: users[3], status: 'Active' },
    { _id: 'emp4', firstName: 'David', lastName: 'Miller', email: 'david.miller@technova.com', employeeId: 'EMP1004', phone: '+1 415-321-4458', department: 'Finance & Accounts', designation: 'Director of Billing', userRef: users[6], status: 'Active' },
    { _id: 'emp5', firstName: 'Alex', lastName: 'Kovac', email: 'alex.kovac@technova.com', employeeId: 'EMP1005', phone: '+1 415-321-4459', department: 'Customer Success', designation: 'Technical Support Lead', userRef: users[5], status: 'Active' }
  ];

  // 5. Audit Logs
  auditLogs = [
    { _id: 'a1', action: 'CREATE_ORGANIZATION', details: 'Organization TechNova Global registered successfully', ipAddress: '192.168.1.1', userAgent: 'Chrome', createdAt: new Date() },
    { _id: 'a2', action: 'ROTATE_JWT_SECRET', details: 'Super Admin rotated security certificates keys', ipAddress: '10.0.0.4', userAgent: 'Safari', createdAt: new Date() },
    { _id: 'a3', action: 'AUTHENTICATION_SUCCESS', details: 'User (hr_manager) logged in securely', ipAddress: '192.168.1.5', userAgent: 'Edge', createdAt: new Date() },
    { _id: 'a4', action: 'UPDATE_EMPLOYEE_PROFILE', details: 'Updated department parameters for EMP1005', ipAddress: '192.168.1.12', userAgent: 'Chrome', createdAt: new Date() }
  ];

  // 6. Requests
  requests = [
    { _id: 'req1', type: 'Leave', details: 'Personal leave requested by Elena Rostova', status: 'Pending', remarks: 'Awaiting HR verification', createdAt: new Date() },
    { _id: 'req2', type: 'Asset Allocation', details: 'MacBook Pro requested for EMP1003', status: 'Pending', remarks: 'Awaiting IT Administrator', createdAt: new Date() },
    { _id: 'req3', type: 'Promotion Request', details: 'Elevate Alex Kovac to Senior Lead role', status: 'Pending', remarks: 'Awaiting budget clearing', createdAt: new Date() }
  ];

  // 7. Leaves
  leaves = [
    { _id: 'l1', leaveType: 'Sick Leave', startDate: '2026-07-04', endDate: '2026-07-06', status: 'Pending', reason: 'Medical dental operations' },
    { _id: 'l2', leaveType: 'Casual Leave', startDate: '2026-07-10', endDate: '2026-07-12', status: 'Approved', reason: 'Family vacation travel' }
  ];

  // 8. Tickets
  tickets = [
    { _id: 't1', title: 'VPN connection failures', category: 'IT Support', priority: 'High', status: 'In Progress', description: 'Internal staging server nodes reject tokens' },
    { _id: 't2', title: 'Payroll tax code discrepancy', category: 'Finance', priority: 'Medium', status: 'Resolved', description: 'W-4 form not parsing state allowances' }
  ];

  // 9. Recruitment Jobs
  recruitmentJobs = [
    { _id: 'j1', title: 'Senior AI Research Engineer', department: 'Research & Development', location: 'Remote / HQ', status: 'Open' },
    { _id: 'j2', title: 'Finance Executive Officer', department: 'Finance & Accounts', location: 'Bangalore HQ', status: 'Closed' }
  ];

  // 10. Recruitment Candidates
  recruitmentCandidates = [
    { _id: 'c1', name: 'Sophia Loren', email: 'sophia@google.com', appliedFor: { title: 'Senior AI Research Engineer' }, status: 'Interviewing' },
    { _id: 'c2', name: 'Jack Daniels', email: 'jack@whiskey.com', appliedFor: { title: 'Senior AI Research Engineer' }, status: 'Applied' }
  ];

  // 11. Expenses
  expenses = [
    { _id: 'exp1', employee: { firstName: 'Elena', lastName: 'Rostova', employeeId: 'EMP1001' }, category: 'Travel & Dining', amount: 450, date: '2026-07-01', description: 'Client Onsite Flight Ticket & Dinner', status: 'Pending' },
    { _id: 'exp2', employee: { firstName: 'Marcus', lastName: 'Vane', employeeId: 'EMP1002' }, category: 'Software Subscriptions', amount: 1200, date: '2026-07-02', description: 'Figma design enterprise seat licenses', status: 'Approved' },
    { _id: 'exp3', employee: { firstName: 'Sarah', lastName: 'Jenkins', employeeId: 'EMP1003' }, category: 'Office Hardware', amount: 350, date: '2026-06-28', description: 'Ergonomic keyboard and desk setup', status: 'Pending' }
  ];

  // 12. Sprint Tasks
  sprintTasks = [
    { _id: 'tsk1', title: 'Implement dynamic JWT token rotations in auth routes', assignee: 'Elena Rostova', priority: 'High', status: 'In Progress', dueDate: '2026-07-10' },
    { _id: 'tsk2', title: 'Design premium light theme dashboard tables', assignee: 'Alex Kovac', priority: 'Medium', status: 'Completed', dueDate: '2026-06-30' },
    { _id: 'tsk3', title: 'Optimize Web Audio chime synth loading buffers', assignee: 'Sarah Jenkins', priority: 'Low', status: 'Code Review', dueDate: '2026-07-05' },
    { _id: 'tsk4', title: 'Refactor client Axios adapters for inline mocks', assignee: 'Marcus Vane', priority: 'High', status: 'In Progress', dueDate: '2026-07-08' }
  ];

  // 13. Team Members
  teamMembers = [
    { _id: 'tm1', firstName: 'Elena', lastName: 'Rostova', role: 'Lead Architect', status: 'Active' },
    { _id: 'tm2', firstName: 'Marcus', lastName: 'Vane', role: 'CISO / Security', status: 'Active' },
    { _id: 'tm3', firstName: 'Alex', lastName: 'Kovac', role: 'Full Stack Dev', status: 'On Leave' },
    { _id: 'tm4', firstName: 'Sarah', lastName: 'Jenkins', role: 'UI Engineer', status: 'Active' }
  ];

  isInitialized = true;
}

export function getMockData(url, method, requestData) {
  initializeData();

  // Route handlers matching our API endpoints
  if (url.includes('/ai/chat')) {
    let prompt = '';
    try {
      const data = typeof requestData === 'string' ? JSON.parse(requestData) : requestData;
      prompt = (data?.prompt || '').toLowerCase();
    } catch (e) {
      prompt = (requestData || '').toLowerCase();
    }
    let answer = '';
    if (prompt.includes('policy') || prompt.includes('guideline') || prompt.includes('rules')) {
      answer = `TechNova Global Policies Context:\n- Casual Leave policy allows up to 14 days per year.\n- Sick Leave requires medical documentation if extending beyond 3 consecutive days.\n- Annual leave must be requested 2 weeks in advance.`;
    } else if (prompt.includes('leave') || prompt.includes('vacation') || prompt.includes('wfh')) {
      answer = `Retrieved Leave Records (In-Memory):\n- Riya Sharma: Sick Leave (Pending) from 2026-07-06 to 2026-07-08\n- Amit Verma: Earned Leave (Pending) from 2026-07-10 to 2026-07-12`;
    } else if (prompt.includes('ticket') || prompt.includes('support') || prompt.includes('it')) {
      answer = `Active Support Tickets:\n- TCK_881: Sarah Jenkins (Hardware) - Priority: High - Status: Open\n- TCK_882: Arjun Mehta (Software) - Priority: Medium - Status: In Progress\n- TCK_885: Karan Patel (Software) - Priority: High - Status: Open`;
    } else if (prompt.includes('candidate') || prompt.includes('hiring') || prompt.includes('resume')) {
      answer = `Active Job Candidates:\n- Sophia Loren (applied for Senior AI Research Engineer) - Status: Interviewing\n- Jack Daniels (applied for Senior AI Research Engineer) - Status: Applied`;
    } else if (prompt.includes('hello') || prompt.includes('hi') || prompt.includes('hey')) {
      answer = `Hello! I am your AI Operations Assistant. How can I help you manage workforce tasks today? You can ask me about company policies, leave records, recruitment pipelines, support tickets, or employee details.`;
    } else {
      answer = `I am your AI Operations Assistant. Try asking me about "company policies", "active leaves", "open support tickets", or "job candidates".`;
    }
    return { answer };
  }

  if (url.includes('/auth/me')) {
    const role = localStorage.getItem('ewap_demo_role') || 'Super Admin';
    const email = `${role.toLowerCase().replace(/ /g, '')}@technova.com`;
    return {
      _id: 'demo_user_id',
      firstName: 'Demo',
      lastName: role,
      email,
      role: { name: role }
    };
  }

  if (url.includes('/organizations')) {
    if (method === 'post' || method === 'POST') {
      const newOrg = {
        _id: `org_${Math.random()}`,
        name: requestData.name,
        code: requestData.code || 'MOCK',
        status: 'Active',
        adminUser: requestData.adminEmail || 'admin@mock.com',
        address: requestData.address || 'Global Headquarters',
        createdAt: new Date()
      };
      organizations.push(newOrg);
      return newOrg;
    }
    if (method === 'put' || method === 'PUT') {
      // Check status update `/organizations/:id/status`
      const idMatch = url.match(/\/organizations\/([^\/]+)/);
      if (idMatch) {
        const id = idMatch[1];
        organizations = organizations.map(org => 
          org._id === id ? { ...org, status: requestData.status } : org
        );
      }
      return { success: true };
    }
    return organizations;
  }

  if (url.includes('/users')) {
    if (method === 'post' || method === 'POST') {
      const newUser = {
        _id: `u_${Math.random()}`,
        username: requestData.username,
        email: requestData.email,
        role: { name: requestData.roleName || 'Employee' },
        isActive: true
      };
      users.push(newUser);
      return newUser;
    }
    if (method === 'put' || method === 'PUT') {
      const idMatch = url.match(/\/users\/([^\/]+)/);
      if (idMatch) {
        const id = idMatch[1];
        users = users.map(u => 
          u._id === id ? { ...u, isActive: requestData.isActive } : u
        );
      }
      return { success: true };
    }
    return users;
  }

  if (url.includes('/audit')) {
    return auditLogs;
  }

  if (url.includes('/requests')) {
    if (method === 'put' || method === 'PUT') {
      const idMatch = url.match(/\/requests\/([^\/]+)/);
      if (idMatch) {
        const id = idMatch[1];
        requests = requests.map(req => 
          req._id === id ? { ...req, status: requestData.status, remarks: requestData.remarks } : req
        );
      }
      return { success: true };
    }
    if (method === 'post' || method === 'POST') {
      const idMatch = url.match(/\/requests\/([^\/]+)\/comment/);
      if (idMatch) {
        // Comment post returns comment object
        return { text: requestData.text, author: 'You', createdAt: new Date() };
      }
    }
    return requests;
  }

  if (url.includes('/employees')) {
    if (method === 'post' || method === 'POST') {
      const newEmp = {
        _id: `emp_${Math.random()}`,
        firstName: requestData.firstName,
        lastName: requestData.lastName,
        email: requestData.email,
        employeeId: `EMP${Math.floor(Math.random() * 900) + 1000}`,
        phone: requestData.phone || '+1 415-000-0000',
        department: requestData.department,
        designation: requestData.designation,
        userRef: { role: { name: requestData.roleName || 'Employee' } },
        status: 'Active'
      };
      employees.push(newEmp);
      return newEmp;
    }
    if (method === 'delete' || method === 'DELETE') {
      const idMatch = url.match(/\/employees\/([^\/]+)/);
      if (idMatch) {
        const id = idMatch[1];
        employees = employees.filter(emp => emp._id !== id);
      }
      return { success: true };
    }
    return employees;
  }

  if (url.includes('/departments')) {
    if (method === 'post' || method === 'POST') {
      const newDept = {
        _id: `d_${Math.random()}`,
        name: requestData.name,
        code: requestData.code,
        status: 'Active'
      };
      departments.push(newDept);
      return newDept;
    }
    return departments;
  }

  if (url.includes('/recruitment/jobs')) {
    if (method === 'post' || method === 'POST') {
      const newJob = {
        _id: `j_${Math.random()}`,
        title: requestData.title,
        department: requestData.department,
        location: requestData.location || 'Remote',
        status: 'Open'
      };
      recruitmentJobs.push(newJob);
      return newJob;
    }
    return recruitmentJobs;
  }

  if (url.includes('/recruitment/candidates')) {
    if (method === 'post' || method === 'POST') {
      const newCand = {
        _id: `c_${Math.random()}`,
        name: requestData.name,
        email: requestData.email,
        appliedFor: { title: requestData.jobTitle || 'AI Architect' },
        status: 'Applied'
      };
      recruitmentCandidates.push(newCand);
      return newCand;
    }
    return recruitmentCandidates;
  }

  if (url.includes('/leaves')) {
    if (method === 'post' || method === 'POST') {
      const newLeave = {
        _id: `l_${Math.random()}`,
        leaveType: requestData.leaveType,
        startDate: requestData.startDate,
        endDate: requestData.endDate,
        status: 'Pending',
        reason: requestData.reason
      };
      leaves.push(newLeave);
      return newLeave;
    }
    return leaves;
  }

  if (url.includes('/support')) {
    if (method === 'post' || method === 'POST') {
      const newTicket = {
        _id: `t_${Math.random()}`,
        title: requestData.title,
        category: requestData.category,
        priority: requestData.priority,
        status: 'Open',
        description: requestData.description
      };
      tickets.push(newTicket);
      return newTicket;
    }
    return tickets;
  }

  if (url.includes('/attendance/today')) {
    return clockInState;
  }

  if (url.includes('/attendance/clock-in')) {
    clockInState = {
      _id: 'att_today',
      clockIn: new Date().toISOString(),
      location: requestData.location || 'HQ Desktop',
      status: 'On Duty'
    };
    return clockInState;
  }

  if (url.includes('/attendance/clock-out')) {
    if (clockInState) {
      clockInState.clockOut = new Date().toISOString();
    }
    return clockInState;
  }

  if (url.includes('/finance/summary')) {
    return {
      budget: 5000000,
      expenses: expenses.reduce((acc, curr) => acc + curr.amount, 0),
      pending: expenses.filter(e => e.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0),
      payroll: 1843200
    };
  }

  if (url.includes('/finance/expenses')) {
    if (method === 'post' || method === 'POST') {
      const newExp = {
        _id: `exp_${Math.random()}`,
        employee: { firstName: 'Demo', lastName: 'Finance', employeeId: 'EMP9999' },
        category: requestData.category || 'General',
        amount: Number(requestData.amount) || 100,
        date: new Date().toISOString().split('T')[0],
        description: requestData.description || 'Mock expense submission',
        status: 'Pending'
      };
      expenses.push(newExp);
      return newExp;
    }
    if (method === 'put' || method === 'PUT') {
      const idMatch = url.match(/\/finance\/expenses\/([^\/]+)/);
      if (idMatch) {
        const id = idMatch[1];
        expenses = expenses.map(exp => 
          exp._id === id ? { ...exp, status: requestData.status } : exp
        );
      }
      return { success: true };
    }
    return expenses;
  }

  if (url.includes('/team/tasks')) {
    if (method === 'post' || method === 'POST') {
      const newTsk = {
        _id: `tsk_${Math.random()}`,
        title: requestData.title || 'New Sprint Task',
        assignee: requestData.assignee || 'Unassigned',
        priority: requestData.priority || 'Medium',
        status: 'In Progress',
        dueDate: requestData.dueDate || '2026-07-15'
      };
      sprintTasks.push(newTsk);
      return newTsk;
    }
    if (method === 'put' || method === 'PUT') {
      const idMatch = url.match(/\/team\/tasks\/([^\/]+)/);
      if (idMatch) {
        const id = idMatch[1];
        sprintTasks = sprintTasks.map(tsk => 
          tsk._id === id ? { ...tsk, status: requestData.status } : tsk
        );
      }
      return { success: true };
    }
    return sprintTasks;
  }

  if (url.includes('/team/members')) {
    return teamMembers;
  }

  // Fallbacks
  return [];
}
