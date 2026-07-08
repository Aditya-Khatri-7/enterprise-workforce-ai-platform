const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

router.post('/', requestController.createRequest);
router.get('/', requestController.getRequests);
router.get('/:id', requestController.getRequestById);
router.post('/:id/comment', requestController.addComment);
router.put('/:id/action', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager', 'Manager'), requestController.takeRequestAction);

module.exports = router;
