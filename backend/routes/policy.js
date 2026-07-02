const express = require('express');
const router = express.Router();
const policyController = require('../controllers/policyController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

router.get('/', policyController.getPolicies);
router.post('/', authorizeRoles('Organization Admin'), policyController.createPolicy);
router.delete('/:id', authorizeRoles('Organization Admin'), policyController.deletePolicy);

module.exports = router;
