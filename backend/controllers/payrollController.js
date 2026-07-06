const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');
const User = require('../models/User');
const mongoose = require('mongoose');
const { createNotification, writeAuditLog } = require('../utils/notification');

const holdSalary = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required to hold salary.' });
    }

    const query = mongoose.isValidObjectId(employeeId)
      ? { _id: employeeId }
      : { employeeId: employeeId };

    const employee = await Employee.findOne(query);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const result = await Payroll.updateMany(
      { employee: employee._id },
      {
        $set: {
          'salaryHold.isOnHold': true,
          'salaryHold.heldBy': req.user._id,
          'salaryHold.heldAt': new Date(),
          'salaryHold.holdReason': reason,
          'salaryHold.releasedAt': null
        }
      }
    );

    if (employee.userRef) {
      await createNotification({
        recipient: employee.userRef,
        title: 'Salary Held',
        message: `Your salary has been put on hold. Reason: ${reason}. Please contact HR or Finance.`,
        organization: req.user.organization
      });

      await writeAuditLog({
        userId: req.user._id,
        action: 'SALARY_HOLD',
        targetUserId: employee.userRef,
        details: { reason },
        req
      });
    }

    res.json({ message: 'Salary put on hold successfully.', employee, count: result.modifiedCount });
  } catch (error) {
    console.error('Hold Salary Error:', error);
    res.status(500).json({ error: 'Server error putting salary on hold' });
  }
};

const releaseSalary = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const query = mongoose.isValidObjectId(employeeId)
      ? { _id: employeeId }
      : { employeeId: employeeId };

    const employee = await Employee.findOne(query);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const result = await Payroll.updateMany(
      { employee: employee._id },
      {
        $set: {
          'salaryHold.isOnHold': false,
          'salaryHold.releasedAt': new Date()
        }
      }
    );

    if (employee.userRef) {
      await createNotification({
        recipient: employee.userRef,
        title: 'Salary Released',
        message: `Your salary hold has been released.`,
        organization: req.user.organization
      });

      await writeAuditLog({
        userId: req.user._id,
        action: 'SALARY_RELEASE',
        targetUserId: employee.userRef,
        details: 'Released salary hold',
        req
      });
    }

    res.json({ message: 'Salary hold released successfully.', employee, count: result.modifiedCount });
  } catch (error) {
    console.error('Release Salary Error:', error);
    res.status(500).json({ error: 'Server error releasing salary hold' });
  }
};

module.exports = {
  holdSalary,
  releaseSalary
};
