const Policy = require('../models/Policy');
const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');
const Candidate = require('../models/Candidate');
const SupportRequest = require('../models/SupportRequest');
const Task = require('../models/Task');

// Safe global fetch wrapper
const performFetch = async (url, options) => {
  if (typeof fetch !== 'undefined') {
    return fetch(url, options);
  }
  // Fallback for older node versions using dynamic import
  const nodeFetch = (await import('node-fetch')).default;
  return nodeFetch(url, options);
};

const handleChat = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt query is required' });

    const orgId = req.user.organization;
    const employeeId = req.user.employeeRef;
    const queryLower = prompt.toLowerCase();

    // 1. Gather all database records for contextual analysis
    const [employees, tasks, leaves, tickets, candidates, policies] = await Promise.all([
      Employee.find({ organization: orgId }),
      Task.find({ organization: orgId }).populate('assignedTo', 'firstName lastName'),
      LeaveRequest.find({ organization: orgId }).populate('employee', 'firstName lastName'),
      SupportRequest.find({ organization: orgId }).populate('employee', 'firstName lastName'),
      Candidate.find({ organization: orgId }),
      Policy.find({ organization: orgId })
    ]);

    // 2. Build system context string
    const systemPrompt = `You are a personalized AI Operations Assistant for EWAP (Enterprise Workforce AI Platform).
You have access to the real-time database context of the user's organization.
Here is the current state of the organization:

### Employees:
${employees.map(e => `- Name: ${e.firstName} ${e.lastName}, Dept: ${e.department}, Designation: ${e.designation}, Status: ${e.status}`).join('\n')}

### Assigned Tasks:
${tasks.map(t => `- Title: ${t.title}, Assignee: ${t.assignedTo ? `${t.assignedTo.firstName} ${t.assignedTo.lastName}` : 'Unassigned'}, Status: ${t.status}, Due: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}`).join('\n')}

### Leave Requests:
${leaves.map(l => `- Employee: ${l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'N/A'}, Type: ${l.leaveType || l.type}, Reason: ${l.reason}, Status: ${l.status}, Dates: ${l.startDate ? new Date(l.startDate).toLocaleDateString() : 'N/A'} to ${l.endDate ? new Date(l.endDate).toLocaleDateString() : 'N/A'}`).join('\n')}

### Support Tickets:
${tickets.map(t => `- Subject: ${t.subject || t.title}, Category: ${t.category}, Priority: ${t.priority}, Status: ${t.status}, Description: ${t.description}`).join('\n')}

### Job Candidates:
${candidates.map(c => `- Candidate: ${c.candidateName || c.name}, Status: ${c.status}`).join('\n')}

### Company Policies:
${policies.map(p => `- Title: ${p.title}, Category: ${p.category}`).join('\n')}

Using this context, answer the user's question. 
If the user asks who is doing what, summarize their tasks. 
If the user asks for advice on task completion chances, analyze the employee's pending/in-progress tasks, active leave requests, and priority to estimate a realistic probability of completing the work on time. Write your analysis clearly and professionally, including actionable operational advice.

Keep your response concise, well-structured in markdown format, and highly professional.

User Question: ${prompt}`;

    // 3. Make real call to Google Gemini API
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: 'Google Gemini API key is missing on the server. Please set GEMINI_API_KEY in your backend .env file.' });
    }
    const geminiModel = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').replace(/^models\//, '');
    
    try {
      const response = await performFetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }]
        })
      });

      const data = await response.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "I was unable to compile the analysis. Please verify your query.";
      res.json({ answer });
    } catch (apiError) {
      console.error('Error calling Gemini API:', apiError);
      res.status(502).json({ error: 'Failed to retrieve response from Gemini API service.' });
    }

  } catch (error) {
    console.error('AI Assistant Error:', error);
    res.status(500).json({ error: 'Server error in AI Operations Assistant' });
  }
};

module.exports = {
  handleChat
};
