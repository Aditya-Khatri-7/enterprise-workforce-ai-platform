const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

// Projects
router.get('/', projectController.getProjects);
router.post('/', authorizeRoles('Super Admin', 'Organization Admin', 'Manager'), projectController.createProject);
router.put('/:id/assign', authorizeRoles('Super Admin', 'Organization Admin', 'Manager'), projectController.assignProjectToTL);
router.put('/:id/agree', projectController.agreeToProject);
router.put('/:id/tl-accept', projectController.tlAcceptProject);
router.put('/:id/reject', projectController.rejectProject);

// Project requests (swap/change)
router.get('/requests', projectController.getProjectRequests);
router.post('/requests', projectController.createProjectRequest);
router.put('/requests/:id/agree', projectController.agreeToProjectRequest);
router.put('/requests/:id/tl-approve', authorizeRoles('Super Admin', 'Organization Admin', 'Team Lead'), projectController.tlApproveProjectRequest);
router.put('/requests/:id/dept-approve', authorizeRoles('Super Admin', 'Organization Admin', 'Manager'), projectController.deptApproveProjectRequest);

// Team requests
router.get('/team-requests', projectController.getTeamRequests);
router.post('/team-requests', projectController.createTeamRequest);
router.put('/team-requests/:id/agree', projectController.agreeToTeamRequest);
router.put('/team-requests/:id/approve', authorizeRoles('Super Admin', 'Organization Admin', 'Manager'), projectController.approveTeamRequest);

module.exports = router;
