const express = require('express');
const router = express.Router();
const workShiftController = require('../controllers/workShiftController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

router.get('/', workShiftController.getWorkShifts);
router.post('/', authorizeRoles('Organization Admin'), workShiftController.createWorkShift);
router.delete('/:id', authorizeRoles('Organization Admin'), workShiftController.deleteWorkShift);

module.exports = router;
