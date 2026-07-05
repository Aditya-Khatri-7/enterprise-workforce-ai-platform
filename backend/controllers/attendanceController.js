const Attendance = require('../models/Attendance');

const getTodayAttendance = async (req, res) => {
  try {
    const orgId = req.user.organization;
    const employeeId = req.user.employeeRef;
    if (!employeeId) return res.status(400).json({ error: 'No employee record associated with this account' });

    const todayStr = new Date().toISOString().split('T')[0];
    const log = await Attendance.findOne({ employee: employeeId, date: todayStr, organization: orgId });
    res.json(log || null);
  } catch (error) {
    console.error('Get Today Attendance Error:', error);
    res.status(500).json({ error: 'Server error retrieving today check status' });
  }
};

const clockIn = async (req, res) => {
  try {
    const orgId = req.user.organization;
    const employeeId = req.user.employeeRef;
    if (!employeeId) return res.status(400).json({ error: 'No employee record associated with this account' });

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Check if already clocked in today
    const existing = await Attendance.findOne({ employee: employeeId, date: todayStr, organization: orgId });
    if (existing) {
      return res.status(400).json({ error: 'You have already clocked in today' });
    }

    const { location } = req.body;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const clockInTime = `${hours}:${minutes}`;

    // Determine status (Late if clock in after 09:15)
    let status = 'Present';
    if (now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15)) {
      status = 'Late';
    }

    const log = new Attendance({
      employee: employeeId,
      date: todayStr,
      clockIn: clockInTime,
      status,
      location,
      organization: orgId
    });

    await log.save();
    res.status(201).json({ message: 'Clocked in successfully!', log });
  } catch (error) {
    console.error('Clock In Error:', error);
    res.status(500).json({ error: 'Server error marking check-in' });
  }
};

const clockOut = async (req, res) => {
  try {
    const orgId = req.user.organization;
    const employeeId = req.user.employeeRef;
    if (!employeeId) return res.status(400).json({ error: 'No employee record associated' });

    const todayStr = new Date().toISOString().split('T')[0];
    const log = await Attendance.findOne({ employee: employeeId, date: todayStr, organization: orgId });
    if (!log) {
      return res.status(400).json({ error: 'You must clock in first' });
    }
    if (log.clockOut) {
      return res.status(400).json({ error: 'You have already clocked out today' });
    }

    const now = new Date();
    const hoursOut = String(now.getHours()).padStart(2, '0');
    const minutesOut = String(now.getMinutes()).padStart(2, '0');
    const clockOutTime = `${hoursOut}:${minutesOut}`;

    // Calculate hours worked
    const [inH, inM] = log.clockIn.split(':').map(Number);
    const inDate = new Date();
    inDate.setHours(inH, inM, 0, 0);

    const diffMs = now - inDate;
    const hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    let finalStatus = log.status; // keep Late if it was Late
    if (hoursWorked < 4) {
      finalStatus = 'Half Day';
    }

    log.clockOut = clockOutTime;
    log.workingHours = hoursWorked;
    log.status = finalStatus;

    await log.save();
    res.json({ message: 'Clocked out successfully!', log });
  } catch (error) {
    console.error('Clock Out Error:', error);
    res.status(500).json({ error: 'Server error marking check-out' });
  }
};

const getMonthlyAttendance = async (req, res) => {
  try {
    const orgId = req.user.organization;
    let filter = { organization: orgId };

    // If Employee, restrict to self
    if (req.user.role?.name === 'Employee') {
      filter.employee = req.user.employeeRef;
    } else if (req.query.employeeId) {
      filter.employee = req.query.employeeId;
    }

    const logs = await Attendance.find(filter)
      .populate('employee', 'firstName lastName employeeId')
      .sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    console.error('Get Monthly Attendance Error:', error);
    res.status(500).json({ error: 'Server error fetching attendance history' });
  }
};

module.exports = {
  getTodayAttendance,
  clockIn,
  clockOut,
  getMonthlyAttendance
};
