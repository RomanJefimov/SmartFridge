const express = require('express');
const path = require('path');

const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../view/public/index.html'));
});

router.get('/user', (req, res) => {
    res.sendFile(path.join(__dirname, '../view/user/user.html'));
});


module.exports = router;