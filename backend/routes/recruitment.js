const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitmentController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

// Jobs CRUD
router.get('/jobs', recruitmentController.getJobs);
router.post('/jobs', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager'), recruitmentController.createJob);

// Candidates CRUD
router.get('/candidates', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager'), recruitmentController.getCandidates);
router.post('/candidates', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager'), recruitmentController.createCandidate);
router.put('/candidates/:id/status', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager'), recruitmentController.updateCandidateStatus);

// Convert Hired to Employee
router.post('/candidates/convert', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager'), recruitmentController.hiredToEmployee);

module.exports = router;
