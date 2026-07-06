const express = require('express');
const router = express.Router();
const objectionController = require('../controllers/objectionController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

router.get('/', objectionController.getObjections);
router.post('/', objectionController.createObjection);
router.put('/:id/resolve', authorizeRoles('Super Admin', 'Organization Admin', 'Team Lead', 'Manager'), objectionController.resolveObjection);

module.exports = router;
