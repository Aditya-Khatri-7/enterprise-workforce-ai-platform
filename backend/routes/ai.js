const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateUser } = require('../middlewares/auth');

router.post('/chat', authenticateUser, aiController.handleChat);

module.exports = router;
