const express = require('express');
const router = express.Router();

// Admin routes for managing users and other administrative tasks
const isAdmin = require('../middleware/isAdmin');
const { getUsers, createUser, updateUser, deleteUser } = require('../controller/adminController');

router.get('/users', isAdmin, getUsers);
router.post('/users', isAdmin, createUser);
router.patch('/users/:id', isAdmin, updateUser);
router.delete('/users/:id', isAdmin, deleteUser);

module.exports = router;