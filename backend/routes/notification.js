const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateUser } = require('../middlewares/auth');

router.use(authenticateUser);

router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markRead);
router.put('/read-all', notificationController.markAllRead);

module.exports = router;
