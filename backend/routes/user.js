const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

router.get('/', authorizeRoles('Super Admin', 'Organization Admin', 'IT Administrator', 'HR Manager', 'Manager', 'Team Lead', 'Finance'), userController.getUsers);
router.post('/', authorizeRoles('Super Admin', 'Organization Admin'), userController.createUser);
router.put('/:id/status', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager'), userController.toggleUserStatus);

// Password resetting and unlocking accounts
router.post('/:id/unlock', authorizeRoles('Super Admin', 'IT Administrator'), userController.unlockUser);
router.post('/:id/reset-password', authorizeRoles('Super Admin', 'IT Administrator'), userController.resetUserPassword);

module.exports = router;
