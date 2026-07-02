const express = require('express');
const router = express.Router();
const designationController = require('../controllers/designationController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

router.get('/', designationController.getDesignations);
router.post('/', authorizeRoles('Organization Admin'), designationController.createDesignation);
router.delete('/:id', authorizeRoles('Organization Admin'), designationController.deleteDesignation);

module.exports = router;
