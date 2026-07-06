const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

router.put('/reassign', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager', 'Team Lead'), teamController.reassignEmployee);
router.get('/available-leads', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager', 'Team Lead'), teamController.getAvailableLeads);

module.exports = router;
