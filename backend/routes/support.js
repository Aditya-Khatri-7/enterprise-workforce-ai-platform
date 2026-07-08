const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

// Staff creates/views ticket; IT Admin & Org Admin can view all org tickets
router.post('/', authorizeRoles('Employee', 'HR Manager', 'Manager', 'Department Manager', 'Team Lead', 'Finance', 'Auditor'), supportController.createSupportRequest);
router.get('/', authorizeRoles('Employee', 'HR Manager', 'Manager', 'Department Manager', 'Team Lead', 'Finance', 'Auditor', 'IT Administrator', 'Organization Admin'), supportController.getSupportRequests);

// IT Admin updates ticket status
router.put('/:id/status', authorizeRoles('IT Administrator', 'Organization Admin'), supportController.updateSupportStatus);

module.exports = router;
