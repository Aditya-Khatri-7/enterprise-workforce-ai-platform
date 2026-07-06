const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

router.get('/', proposalController.getProposals);
router.post('/', proposalController.createProposal);
router.put('/:id/review', authorizeRoles('Super Admin', 'Organization Admin', 'Team Lead', 'Manager'), proposalController.reviewProposal);

module.exports = router;
