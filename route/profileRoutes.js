const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getProfile, updateProfile } = require('../controller/profileController');

// Profile routes for retrieving and updating user profile information
router.get('/', protect, getProfile);
router.patch('/', protect, updateProfile);

module.exports = router;