const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateUser } = require('../middlewares/auth');

// We will port the old forgot-password, reset-password, and send-otp logic into a separate controller shortly.
// For now, mapping the core auth logic.

router.post('/login', authController.login);
router.post('/logout', authenticateUser, authController.logout);
router.post('/refresh', authController.refresh);
router.get('/me', authenticateUser, authController.me);
router.post('/change-password', authenticateUser, authController.changePassword);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
