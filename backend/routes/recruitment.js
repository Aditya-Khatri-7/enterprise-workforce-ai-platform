const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitmentController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { resumeUpload } = require('../middlewares/upload');

// Public routes (no authentication)
router.get('/public/jobs', recruitmentController.getPublicJobs);
router.get('/public/jobs/:id', recruitmentController.getPublicJobById);
router.post('/public/apply', resumeUpload.single('resume'), recruitmentController.applyToJob);

router.use(authenticateUser);

// Jobs CRUD
router.get('/jobs', recruitmentController.getJobs);
router.post('/jobs', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager'), recruitmentController.createJob);

// Candidates CRUD
router.get('/candidates', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager'), recruitmentController.getCandidates);
router.post('/candidates', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager'), recruitmentController.createCandidate);
router.put('/candidates/:id/status', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager'), recruitmentController.updateCandidateStatus);
router.post('/candidates/:id/rescreen', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager'), recruitmentController.rescreenCandidate);
router.get('/candidates/:id/resume', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager'), recruitmentController.getResumeDownload);

// Convert Hired to Employee
router.post('/candidates/convert', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager'), recruitmentController.hiredToEmployee);

module.exports = router;
