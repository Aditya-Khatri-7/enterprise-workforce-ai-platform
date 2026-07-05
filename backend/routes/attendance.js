const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateUser } = require('../middlewares/auth');

router.use(authenticateUser);

router.get('/today', attendanceController.getTodayAttendance);
router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);
router.get('/history', attendanceController.getMonthlyAttendance);

module.exports = router;
