require('dotenv').config();
const express = require('express');
const path = require('path');

const authRoutes = require('./route/authRoutes.js');
const adminRoutes = require('./route/adminRoutes.js');
const connectDB = require('./config/db.js');
const viewRoutes = require('./route/viewRoutes.js');
const fridgeRoutes = require('./route/fridgeRoutes.js');
const profileRoutes = require('./route/profileRoutes.js');


const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/fridge', fridgeRoutes);
app.use('/api/profile', profileRoutes);

app.use(express.static(path.join(__dirname, 'view/public')));
app.use('/user', express.static(path.join(__dirname, 'view/user')));

app.use('/', viewRoutes);
connectDB();

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'view/public/404.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});