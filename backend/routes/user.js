const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

router.get('/', authorizeRoles('Super Admin', 'Organization Admin', 'IT Administrator', 'HR Manager', 'Manager', 'Team Lead', 'Finance'), userController.getUsers);
router.post('/', authorizeRoles('Super Admin', 'Organization Admin'), userController.createUser);
router.put('/:id/status', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager'), userController.toggleUserStatus);
router.delete('/:id', authorizeRoles('Super Admin', 'Organization Admin'), userController.deleteUser);
router.put('/:id/role', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager'), userController.changeUserRole);

// Deactivation / Reactivation Chain
router.post('/:id/deactivate', userController.deactivateUser);
router.post('/:id/reactivation-request', userController.requestReactivation);
router.put('/:id/reactivation-review', userController.reviewReactivation);
router.get('/:id/reactivation-status', userController.getReactivationStatus);

// Password resetting and unlocking accounts
router.post('/:id/unlock', authorizeRoles('Super Admin', 'IT Administrator'), userController.unlockUser);
router.post('/:id/reset-password', authorizeRoles('Super Admin', 'IT Administrator'), userController.resetUserPassword);

module.exports = router;
