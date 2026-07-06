const express = require('express');
const router = express.Router();
const officeLocationController = require('../controllers/officeLocationController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

router.get('/', officeLocationController.getOfficeLocations);
router.post('/', authorizeRoles('Super Admin', 'Organization Admin'), officeLocationController.createOfficeLocation);
router.delete('/:id', authorizeRoles('Super Admin', 'Organization Admin'), officeLocationController.deleteOfficeLocation);

module.exports = router;
