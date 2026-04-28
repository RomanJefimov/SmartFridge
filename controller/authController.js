const User = require('../model/User');
const bcrypt = require('bcryptjs');

exports.register = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const existing = await User.findOne({ email });

        if (existing) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            email,
            passwordHash
        });

        return res.status(201).json({
            message: 'User registered',
            user: {
                id: user._id,
                email: user.email
            }
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error);

        return res.status(500).json({
            message: 'Server error'
        });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);

    if (!match) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    res.json({
        message: 'Login successful',
        role: user.role,
        email: user.email
    });
};