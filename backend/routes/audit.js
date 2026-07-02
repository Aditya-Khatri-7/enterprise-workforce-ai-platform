const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

// Only Super Admin can view audit logs
router.get('/', authorizeRoles('Super Admin'), auditController.getAuditLogs);

module.exports = router;
