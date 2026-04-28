require('dotenv').config();
const express = require('express');
const path = require('path');

const authRoutes = require('./route/authRoutes.js');
const adminRoutes = require('./route/adminRoutes.js');
const connectDB = require('./config/db.js');
const viewRoutes = require('./route/viewRoutes.js');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'view/public')));
app.use('/user', express.static(path.join(__dirname, 'view/user')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/', viewRoutes);
connectDB();



app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});