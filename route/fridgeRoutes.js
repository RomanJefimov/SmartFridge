const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { analyzeImage, getHistory, getLatest } = require('../controller/fridgeController');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze', protect, upload.single('image'), analyzeImage);
router.get('/history', protect, getHistory);
router.get('/latest', protect, getLatest);

module.exports = router;