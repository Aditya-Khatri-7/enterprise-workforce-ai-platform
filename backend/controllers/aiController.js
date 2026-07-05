const Policy = require('../models/Policy');
const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');
const Candidate = require('../models/Candidate');
const SupportRequest = require('../models/SupportRequest');

const handleChat = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt query is required' });

    const orgId = req.user.organization;
    const employeeId = req.user.employeeRef;
    const queryLower = prompt.toLowerCase();

    let contextData = '';
    let responseText = '';

    // 1. Gather context from local database models based on keywords
    if (queryLower.includes('policy') || queryLower.includes('guideline') || queryLower.includes('rules')) {
      const policies = await Policy.find({ organization: orgId });
      if (policies.length > 0) {
        contextData += 'Policies:\n' + policies.map(p => `Category: ${p.category}, Title: ${p.title}, Content: ${p.content}`).join('\n') + '\n';
      } else {
        contextData += 'No policies defined yet.\n';
      }
    }

    if (queryLower.includes('leave') || queryLower.includes('vacation') || queryLower.includes('wfh')) {
      let leaves = [];
      if (req.user.role?.name === 'Employee' && employeeId) {
        leaves = await LeaveRequest.find({ employee: employeeId, organization: orgId });
      } else {
        leaves = await LeaveRequest.find({ organization: orgId }).populate('employee', 'firstName lastName');
      }
      
      if (leaves.length > 0) {
        contextData += 'Leave Records:\n' + leaves.map(l => {
          const empName = l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'Self';
          return `- Employee: ${empName}, Type: ${l.type}, Reason: ${l.reason}, Status: ${l.status}, Period: ${new Date(l.startDate).toLocaleDateString()} to ${new Date(l.endDate).toLocaleDateString()}`;
        }).join('\n') + '\n';
      } else {
        contextData += 'No leave requests recorded.\n';
      }
    }

    if (queryLower.includes('candidate') || queryLower.includes('hiring') || queryLower.includes('resume')) {
      if (['Super Admin', 'Organization Admin', 'HR Manager'].includes(req.user.role?.name)) {
        const candidates = await Candidate.find({ organization: orgId }).populate('jobPosting', 'title');
        if (candidates.length > 0) {
          contextData += 'Job Candidates:\n' + candidates.map(c => `- Candidate: ${c.candidateName}, Job: ${c.jobPosting?.title || 'General'}, Experience: ${c.experience} yrs, Skills: ${c.skills?.join(', ')}, Screening Score: ${c.aiScore}%, Status: ${c.status}`).join('\n') + '\n';
        } else {
          contextData += 'No candidate applications found.\n';
        }
      } else {
        contextData += 'Access denied to candidate recruitment records.\n';
      }
    }

    if (queryLower.includes('ticket') || queryLower.includes('support') || queryLower.includes('it')) {
      let tickets = [];
      if (req.user.role?.name === 'Employee' && employeeId) {
        tickets = await SupportRequest.find({ employee: employeeId, organization: orgId });
      } else {
        tickets = await SupportRequest.find({ organization: orgId }).populate('employee', 'firstName lastName');
      }

      if (tickets.length > 0) {
        contextData += 'Support Tickets:\n' + tickets.map(t => {
          const empName = t.employee ? `${t.employee.firstName} ${t.employee.lastName}` : 'Self';
          return `- Ticket By: ${empName}, Category: ${t.category}, Subject: ${t.subject}, Details: ${t.description || 'N/A'}, Status: ${t.status}`;
        }).join('\n') + '\n';
      } else {
        contextData += 'No support tickets raised.\n';
      }
    }

    if (queryLower.includes('staff') || queryLower.includes('employee') || queryLower.includes('team')) {
      if (req.user.role?.name !== 'Employee') {
        const employees = await Employee.find({ organization: orgId });
        contextData += 'Staff Roster:\n' + employees.map(e => `- ID: ${e.employeeId}, Name: ${e.firstName} ${e.lastName}, Dept: ${e.department}, Designation: ${e.designation}, Status: ${e.status}`).join('\n') + '\n';
      } else {
        const selfEmp = await Employee.findOne({ _id: employeeId, organization: orgId });
        if (selfEmp) {
          contextData += `Your Profile Info: ID: ${selfEmp.employeeId}, Dept: ${selfEmp.department}, Designation: ${selfEmp.designation}, Status: ${selfEmp.status}\n`;
        }
      }
    }

    // 2. Generate final response based on context if context is gathered, otherwise general help text
    if (contextData) {
      // Offline RAG Prompt processing
      if (queryLower.includes('policy')) {
        responseText = `Based on the system's policy catalog: \n\n` + 
                       (contextData.includes('Policies:') 
                         ? contextData.substring(contextData.indexOf('Policies:')) 
                         : "I couldn't find any specific company policy documents. Please ensure that the Organization Administrator has uploaded active policies in the Admin Settings.");
      } else if (queryLower.includes('leave')) {
        responseText = `Here are the matching Leave Records retrieved from the database:\n\n` + 
                       contextData.substring(contextData.indexOf('Leave Records:'));
      } else if (queryLower.includes('candidate') || queryLower.includes('resume')) {
        responseText = `Here is the current Candidate Recruitment status:\n\n` + 
                       contextData.substring(contextData.indexOf('Job Candidates:'));
      } else if (queryLower.includes('ticket') || queryLower.includes('support')) {
        responseText = `Here is the log of Support Tickets matching your query:\n\n` + 
                       contextData.substring(contextData.indexOf('Support Tickets:'));
      } else {
        responseText = `Retrieved context data:\n\n${contextData}\nHow else can I assist you with this info?`;
      }
    } else {
      // General helpful fallback prompts matching common workforce queries
      if (queryLower.includes('hello') || queryLower.includes('hi') || queryLower.includes('hey')) {
        responseText = `Hello! I am your AI Operations Assistant. How can I help you manage workforce tasks today? You can ask me about company policies, leave records, recruitment pipelines, support tickets, or employee details.`;
      } else {
        responseText = `I couldn't retrieve any direct context from the database for your query. 
Try asking me something like:
- "What are our company policies?"
- "Show me our team leaves / casual leaves"
- "List our job candidates and their screening status"
- "Are there any open support tickets?"`;
      }
    }

    res.json({ answer: responseText });
  } catch (error) {
    console.error('AI Assistant Error:', error);
    res.status(500).json({ error: 'Server error in AI Operations Assistant' });
  }
};

module.exports = {
  handleChat
};
