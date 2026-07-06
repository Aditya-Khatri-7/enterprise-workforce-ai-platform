const express = require('express');
const router = express.Router();
const grievanceController = require('../controllers/grievanceController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

router.post('/', grievanceController.createGrievance);
router.get('/', grievanceController.getGrievances);
router.put('/:id/resolve', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager', 'Manager', 'Department Manager'), grievanceController.resolveGrievance);

module.exports = router;
