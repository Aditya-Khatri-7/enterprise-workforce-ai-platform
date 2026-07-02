const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

// Employee applies for leave, everyone else can view scoped leaves
router.post('/', authorizeRoles('Employee'), leaveController.applyLeave);
router.get('/', authorizeRoles('Employee', 'Organization Admin', 'HR Manager'), leaveController.getLeaves);

// Only Organization Admin can approve/reject
router.put('/:id/status', authorizeRoles('Organization Admin', 'HR Manager'), leaveController.updateLeaveStatus);

module.exports = router;
