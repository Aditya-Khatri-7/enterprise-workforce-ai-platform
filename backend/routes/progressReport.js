const express = require('express');
const router = express.Router();
const progressReportController = require('../controllers/progressReportController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

router.get('/', progressReportController.getProgressReports);
router.post('/request', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager'), progressReportController.requestProgressReport);
router.put('/:id/submit', authorizeRoles('Super Admin', 'Organization Admin', 'Team Lead'), progressReportController.submitProgressReport);
router.put('/:id/feedback', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager'), progressReportController.submitFeedback);

module.exports = router;
