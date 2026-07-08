const Project = require('../models/Project');
const ProjectRequest = require('../models/ProjectRequest');
const TeamRequest = require('../models/TeamRequest');
const Employee = require('../models/Employee');
const User = require('../models/User');

// Helper to get total team size (employees reporting to team lead)
const getTeamEmployees = async (teamLeadId) => {
  return await Employee.find({ reportingManager: teamLeadId, status: 'Active' });
};

// 1. Get all projects
const getProjects = async (req, res) => {
  try {
    const orgId = req.user.organization;
    if (!orgId) return res.status(400).json({ error: 'User organization not found' });
    const projects = await Project.find({ organization: orgId })
      .populate('assignedTeamLead', 'firstName lastName employeeId')
      .populate('employees', 'firstName lastName employeeId');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Create a new project
const createProject = async (req, res) => {
  try {
    const orgId = req.user.organization;
    const { name, description, department } = req.body;
    if (!name || !department) {
      return res.status(400).json({ error: 'Name and Department are required' });
    }
    const project = new Project({
      name,
      description,
      department,
      organization: orgId
    });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Assign project to Team Lead
const assignProjectToTL = async (req, res) => {
  try {
    const { id } = req.params;
    const { teamLeadId } = req.body; // Employee ID of the Team Lead
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const teamLead = await Employee.findById(teamLeadId);
    if (!teamLead) return res.status(404).json({ error: 'Team Lead not found' });

    // Find all active employees under this team lead
    const teamMembers = await getTeamEmployees(teamLeadId);
    const teamMemberIds = teamMembers.map(m => m._id);

    project.assignedTeamLead = teamLeadId;
    project.employees = teamMemberIds;
    project.pendingAgreement = true;
    project.agreedEmployees = []; // Reset agreements
    await project.save();

    res.json({ message: 'Project assigned to Team Lead. Waiting for team agreement.', project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Employee agrees to assigned project
const agreeToProject = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeRef = req.user.employeeRef;
    if (!employeeRef) return res.status(400).json({ error: 'Only employees can agree' });

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (!project.pendingAgreement) {
      return res.status(400).json({ error: 'Project is already active' });
    }

    // Verify employee is assigned to this project
    if (!project.employees.includes(employeeRef)) {
      return res.status(403).json({ error: 'You are not assigned to this project' });
    }

    if (project.agreedEmployees.includes(employeeRef)) {
      return res.status(400).json({ error: 'You have already agreed to this project' });
    }

    project.agreedEmployees.push(employeeRef);

    // If all assigned employees agreed, set pendingAgreement to false
    if (project.agreedEmployees.length >= project.employees.length) {
      project.pendingAgreement = false;
    }
    await project.save();

    res.json({ message: 'Agreement registered successfully', project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. Get project requests
const getProjectRequests = async (req, res) => {
  try {
    const orgId = req.user.organization;
    const requests = await ProjectRequest.find({ organization: orgId })
      .populate('teamLead', 'firstName lastName')
      .populate('currentProject', 'name')
      .populate('requestedProject', 'name')
      .populate('employeesAgreed', 'firstName lastName');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 6. Create project request (e.g. swap project)
const createProjectRequest = async (req, res) => {
  try {
    const orgId = req.user.organization;
    const { type, teamLeadId, requestedProjectId, comments } = req.body;

    const teamLead = await Employee.findById(teamLeadId);
    if (!teamLead) return res.status(404).json({ error: 'Team Lead not found' });

    // Find current project of the team lead
    const currentProject = await Project.findOne({ assignedTeamLead: teamLeadId, status: 'Ongoing' });

    const request = new ProjectRequest({
      type,
      organization: orgId,
      teamLead: teamLeadId,
      currentProject: currentProject ? currentProject._id : undefined,
      requestedProject: requestedProjectId,
      employeesAgreed: type === 'EmployeeRequest' ? [req.user.employeeRef] : [],
      status: type === 'TeamLeadRequest' ? 'Pending_Dept_Approval' : 'Pending_TL_Approval',
      comments
    });

    await request.save();
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 7. Join/agree to project request
const agreeToProjectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeRef = req.user.employeeRef;
    if (!employeeRef) return res.status(400).json({ error: 'Only employees can agree' });

    const request = await ProjectRequest.findById(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (request.status !== 'Pending_TL_Approval') {
      return res.status(400).json({ error: 'Request is not in pending TL status' });
    }

    if (request.employeesAgreed.includes(employeeRef)) {
      return res.status(400).json({ error: 'You already agreed to this request' });
    }

    request.employeesAgreed.push(employeeRef);

    // Check if > 2/3 agreed
    const teamMembers = await getTeamEmployees(request.teamLead);
    const agreedCount = request.employeesAgreed.length;
    const totalCount = teamMembers.length;

    if (totalCount > 0 && agreedCount / totalCount >= 2 / 3) {
      // Auto move status to TL approval if > 2/3 agreed
      // It remains in Pending_TL_Approval but flagged as ready
    }

    await request.save();
    res.json({ message: 'Agreed to project request successfully', request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 8. Approve project request as Team Lead
const tlApproveProjectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ProjectRequest.findById(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (request.status !== 'Pending_TL_Approval') {
      return res.status(400).json({ error: 'Request is not pending Team Lead approval' });
    }

    const teamMembers = await getTeamEmployees(request.teamLead);
    const agreedCount = request.employeesAgreed.length;
    const totalCount = teamMembers.length;

    if (totalCount > 0 && (agreedCount / totalCount) < 2 / 3) {
      return res.status(400).json({ error: 'Less than 2/3 of employees have agreed to this request' });
    }

    request.status = 'Pending_Dept_Approval';
    await request.save();

    res.json({ message: 'Approved by Team Lead. Forwarded to Department Manager.', request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 9. Approve project request as Department Manager
const deptApproveProjectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ProjectRequest.findById(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (request.status !== 'Pending_Dept_Approval') {
      return res.status(400).json({ error: 'Request is not pending Department approval' });
    }

    // Apply the swap!
    // 1. Remove Team Lead and employees from current project
    if (request.currentProject) {
      await Project.findByIdAndUpdate(request.currentProject, {
        $set: { assignedTeamLead: null, employees: [] }
      });
    }

    // 2. Set Team Lead and employees to new project
    const teamMembers = await getTeamEmployees(request.teamLead);
    const employeeIds = teamMembers.map(m => m._id);

    await Project.findByIdAndUpdate(request.requestedProject, {
      $set: {
        assignedTeamLead: request.teamLead,
        employees: employeeIds,
        pendingAgreement: false // Swapped project is active immediately
      }
    });

    request.status = 'Approved';
    await request.save();

    res.json({ message: 'Project request approved. Assignment updated successfully.', request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 10. Get all team requests
const getTeamRequests = async (req, res) => {
  try {
    const orgId = req.user.organization;
    const requests = await TeamRequest.find({ organization: orgId })
      .populate('employee', 'firstName lastName')
      .populate('currentTeamLead', 'firstName lastName')
      .populate('requestedTeamLead', 'firstName lastName')
      .populate('employeesAgreed', 'firstName lastName');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 11. Create team request
const createTeamRequest = async (req, res) => {
  try {
    const orgId = req.user.organization;
    const { type, employeeId, currentTeamLeadId, requestedTeamLeadId, comments } = req.body;

    const request = new TeamRequest({
      type,
      organization: orgId,
      employee: type === 'MoveTeam' ? (employeeId || req.user.employeeRef) : undefined,
      currentTeamLead: currentTeamLeadId,
      requestedTeamLead: requestedTeamLeadId,
      employeesAgreed: type === 'ChangeTeamLead' ? [req.user.employeeRef] : [],
      status: 'Pending',
      comments
    });

    await request.save();
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 12. Join/agree to ChangeTeamLead request
const agreeToTeamRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeRef = req.user.employeeRef;
    if (!employeeRef) return res.status(400).json({ error: 'Only employees can agree' });

    const request = await TeamRequest.findById(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (request.type !== 'ChangeTeamLead') {
      return res.status(400).json({ error: 'You can only agree to ChangeTeamLead requests' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ error: 'Request is no longer pending' });
    }

    if (request.employeesAgreed.includes(employeeRef)) {
      return res.status(400).json({ error: 'You already agreed to this request' });
    }

    request.employeesAgreed.push(employeeRef);
    await request.save();

    res.json({ message: 'Agreed to Team Lead change request successfully', request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 13. Approve team request as Department Manager
const approveTeamRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await TeamRequest.findById(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (request.status !== 'Pending') {
      return res.status(400).json({ error: 'Request is no longer pending' });
    }

    if (request.type === 'MoveTeam') {
      // Simply update the employee's reporting manager
      await Employee.findByIdAndUpdate(request.employee, {
        $set: { reportingManager: request.requestedTeamLead }
      });
    } else if (request.type === 'ChangeTeamLead') {
      // Verify > 2/3 agreed
      const teamMembers = await getTeamEmployees(request.currentTeamLead);
      const agreedCount = request.employeesAgreed.length;
      const totalCount = teamMembers.length;

      if (totalCount > 0 && (agreedCount / totalCount) < 2 / 3) {
        return res.status(400).json({ error: 'Less than 2/3 of employees have agreed to this team lead change' });
      }

      // Update reporting manager for all agreed employees (or all employees in the team)
      // To satisfy: "if 2/3 employees want to work on project but not under the team lead they can change team lead also and department would approve it"
      // We will move ALL team members who report to currentTeamLead to requestedTeamLead
      await Employee.updateMany(
        { reportingManager: request.currentTeamLead },
        { $set: { reportingManager: request.requestedTeamLead }
      });

      // Also update Project assignment for the current project
      const project = await Project.findOne({ assignedTeamLead: request.currentTeamLead, status: 'Ongoing' });
      if (project) {
        project.assignedTeamLead = request.requestedTeamLead;
        await project.save();
      }
    }

    request.status = 'Approved';
    await request.save();

    res.json({ message: 'Team request approved successfully', request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 14. Team Lead accepts project assignment
const tlAcceptProject = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeRef = req.user.employeeRef;
    if (!employeeRef) return res.status(400).json({ error: 'Only employee references (Team Leads) can accept' });

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (project.assignedTeamLead.toString() !== employeeRef.toString()) {
      return res.status(403).json({ error: 'You are not the assigned Team Lead for this project' });
    }

    project.tlAcceptedStatus = 'Accepted';
    await project.save();

    res.json({ message: 'Project accepted by Team Lead', project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 15. Employee rejects working on assigned project individually
const rejectProject = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeRef = req.user.employeeRef;
    if (!employeeRef) return res.status(400).json({ error: 'Only employees can reject' });

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (!project.employees.includes(employeeRef)) {
      return res.status(403).json({ error: 'You are not assigned to this project' });
    }

    if (!project.rejectedEmployees) {
      project.rejectedEmployees = [];
    }

    if (project.rejectedEmployees.includes(employeeRef)) {
      return res.status(400).json({ error: 'You have already rejected this project' });
    }

    project.rejectedEmployees.push(employeeRef);
    // Remove from agreed if previously agreed
    project.agreedEmployees = project.agreedEmployees.filter(e => e.toString() !== employeeRef.toString());
    await project.save();

    res.json({ message: 'Project assignment rejected individually', project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProjectStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeIds } = req.body;

    if (!Array.isArray(employeeIds)) {
      return res.status(400).json({ error: 'employeeIds must be an array' });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.user.role?.name === 'Team Lead') {
      if (String(project.assignedTeamLead) !== String(req.user.employeeRef)) {
        return res.status(403).json({ error: 'You are not the assigned Team Lead for this project' });
      }
    }

    project.employees = employeeIds;
    if (project.agreedEmployees) {
      project.agreedEmployees = project.agreedEmployees.filter(e => employeeIds.includes(String(e)));
    }
    if (project.rejectedEmployees) {
      project.rejectedEmployees = project.rejectedEmployees.filter(e => employeeIds.includes(String(e)));
    }

    await project.save();
    res.json({ message: 'Project staff updated successfully', project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProjects,
  createProject,
  assignProjectToTL,
  agreeToProject,
  getProjectRequests,
  createProjectRequest,
  agreeToProjectRequest,
  tlApproveProjectRequest,
  deptApproveProjectRequest,
  getTeamRequests,
  createTeamRequest,
  agreeToTeamRequest,
  approveTeamRequest,
  tlAcceptProject,
  rejectProject,
  updateProjectStaff
};
