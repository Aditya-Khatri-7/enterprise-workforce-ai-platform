const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

// Authorized roles can view audit logs (Organization level roles will be filtered by organization)
router.get('/', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager', 'IT Administrator', 'Auditor'), auditController.getAuditLogs);

module.exports = router;
