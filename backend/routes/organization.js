const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

router.get('/', authorizeRoles('Super Admin'), organizationController.getOrganizations);
router.post('/', authorizeRoles('Super Admin'), organizationController.createOrganization);
router.post('/assign-admin', authorizeRoles('Super Admin'), organizationController.assignAdmin);
router.put('/:id/status', authorizeRoles('Super Admin'), organizationController.updateOrganizationStatus);

module.exports = router;
