const express = require('express');
const router = express.Router();

const isAdmin = require('../middleware/isAdmin');
const { getUsers, deleteUser } = require('../controller/adminController');

router.get('/users', isAdmin, getUsers);
router.delete('/users/:id', isAdmin, deleteUser);

module.exports = router;