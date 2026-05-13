const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getProfile, updateProfile } = require('../controller/profileController');

router.get('/', protect, getProfile);
router.patch('/', protect, updateProfile);

module.exports = router;