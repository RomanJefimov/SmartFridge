const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const port = 3000;

//Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

//MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

//Mongoose Schema and Model
const User = mongoose.model('User', new mongoose.Schema({
    email: String,
    password: String
}));

const Admin = mongoose.model('Admin', new mongoose.Schema({
    email: String,
    password: String
}));

//Registration
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    const user = new User({ 
        email, 
        password: hashed 
    });
    await user.save();

    res.json({ message: 'User registered' });
});

//Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    let role = 'user';

    if (!user) {
        user = await Admin.findOne({ email });
        role = 'admin';
    }

    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        return res.status(400).json({ message: 'wrong password' });
    }

    res.json({
        message: 'Login successful',
        role: role
    });
});

//Start server
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});