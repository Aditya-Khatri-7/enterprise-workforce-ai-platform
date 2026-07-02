const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

// Employee creates a ticket; IT Admin & Org Admin can view all org tickets
router.post('/', authorizeRoles('Employee'), supportController.createSupportRequest);
router.get('/', authorizeRoles('Employee', 'IT Administrator', 'Organization Admin'), supportController.getSupportRequests);

// IT Admin updates ticket status
router.put('/:id/status', authorizeRoles('IT Administrator', 'Organization Admin'), supportController.updateSupportStatus);

module.exports = router;
