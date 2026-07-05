const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateUser);

// Asset Inventory routes
router.get('/', assetController.getAssets);
router.post('/', authorizeRoles('Super Admin', 'Organization Admin', 'IT Administrator'), assetController.createAsset);
router.put('/:id', authorizeRoles('Super Admin', 'Organization Admin', 'IT Administrator'), assetController.updateAssetStatus);
router.put('/:id/assign', authorizeRoles('Super Admin', 'Organization Admin', 'IT Administrator'), assetController.assignAsset);
router.delete('/:id', authorizeRoles('Super Admin', 'Organization Admin', 'IT Administrator'), assetController.deleteAsset);

module.exports = router;
