const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

// Hold/Release salary routes
router.post('/:employeeId/hold', authorizeRoles('Finance', 'Super Admin'), payrollController.holdSalary);
router.post('/:employeeId/release', authorizeRoles('Finance', 'Super Admin'), payrollController.releaseSalary);

module.exports = router;
