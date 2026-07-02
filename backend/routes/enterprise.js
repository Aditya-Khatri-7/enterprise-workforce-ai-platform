const express = require('express');
const router = express.Router();
const enterpriseController = require('../controllers/enterpriseController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

// Tasks
router.get('/tasks', enterpriseController.getTasks);
router.post('/tasks', authorizeRoles('Super Admin', 'Organization Admin', 'Manager', 'Team Lead'), enterpriseController.createTask);
router.put('/tasks/:id', enterpriseController.updateTaskStatus);

// Reviews
router.get('/reviews', enterpriseController.getReviews);
router.post('/reviews', authorizeRoles('Super Admin', 'Organization Admin', 'Manager'), enterpriseController.createReview);

// Payroll
router.get('/payrolls', enterpriseController.getPayrolls);
router.post('/payrolls', authorizeRoles('Super Admin', 'Organization Admin', 'Finance'), enterpriseController.createPayroll);
router.put('/payrolls/:id', authorizeRoles('Super Admin', 'Organization Admin', 'Finance'), enterpriseController.updatePayrollStatus);

// Attendance Corrections
router.get('/corrections', enterpriseController.getCorrections);
router.post('/corrections', enterpriseController.createCorrection);
router.put('/corrections/:id', authorizeRoles('Super Admin', 'Organization Admin', 'Manager'), enterpriseController.updateCorrectionStatus);

module.exports = router;
