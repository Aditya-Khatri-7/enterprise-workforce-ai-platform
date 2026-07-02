const SupportRequest = require('../models/SupportRequest');
const Employee = require('../models/Employee');

const createSupportRequest = async (req, res) => {
  try {
    const { category, subject, description } = req.body;
    if (!category || !subject) {
      return res.status(400).json({ error: 'Category and subject are required' });
    }

    const employee = await Employee.findOne({ userRef: req.user._id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found. Please contact HR.' });
    }
    if (!req.user.organization) {
      return res.status(400).json({ error: 'Not associated with any organization' });
    }

    const ticket = new SupportRequest({
      employee: employee._id,
      organization: req.user.organization,
      category,
      subject,
      description,
      status: 'Open'
    });
    await ticket.save();

    res.status(201).json({ message: 'Support ticket raised successfully', ticket });
  } catch (error) {
    console.error('Create Support Request Error:', error);
    res.status(500).json({ error: 'Server error creating support ticket' });
  }
};

const getSupportRequests = async (req, res) => {
  try {
    const roleName = req.user.role?.name;
    let filter = {};

    if (roleName === 'Employee') {
      const employee = await Employee.findOne({ userRef: req.user._id });
      if (!employee) return res.json([]);
      filter = { employee: employee._id };
    } else {
      // IT Admin, Org Admin see all tickets in their org
      filter = { organization: req.user.organization };
    }

    const tickets = await SupportRequest.find(filter)
      .populate({ path: 'employee', select: 'firstName lastName employeeId email department' })
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error('Get Support Requests Error:', error);
    res.status(500).json({ error: 'Server error fetching support tickets' });
  }
};

const updateSupportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Open', 'In Progress', 'Resolved', 'Closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const ticket = await SupportRequest.findOne({ _id: id, organization: req.user.organization });
    if (!ticket) return res.status(404).json({ error: 'Support ticket not found' });

    ticket.status = status;
    await ticket.save();

    res.json({ message: `Ticket status updated to ${status}`, ticket });
  } catch (error) {
    console.error('Update Support Status Error:', error);
    res.status(500).json({ error: 'Server error updating ticket status' });
  }
};

module.exports = { createSupportRequest, getSupportRequests, updateSupportStatus };
