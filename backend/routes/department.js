const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

router.get('/', departmentController.getDepartments);
router.post('/', authorizeRoles('Organization Admin'), departmentController.createDepartment);
router.delete('/:id', authorizeRoles('Organization Admin'), departmentController.deleteDepartment);

module.exports = router;
