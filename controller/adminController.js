const User = require('../model/User');
const bcrypt = require('bcryptjs');

// Admin controller for handling administrative operations such as managing users, including listing all users, creating new users, updating user roles and passwords, and deleting users. These operations are protected and can only be performed by users with the admin role.
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({}, '_id email role lastLoginAt createdAt');
        res.json({ users });
    } catch (error) {
        console.error('GET USERS ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a new user with the specified email, password, and role. The password is hashed before being stored in the database, and the endpoint returns the created user's information without the password hash.
exports.createUser = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({ email, passwordHash, role: role || 'user' });

        res.status(201).json({
            message: 'User created',
            user: { id: user._id, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error('CREATE USER ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a user's role and/or password. Admins can change other users' roles and passwords, but cannot remove their own admin role or delete themselves. The endpoint validates the new password if provided, ensuring it meets certain complexity requirements before hashing and storing it.
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, password } = req.body;

        if (req.user.id.toString() === id && role && role !== 'admin') {
            return res.status(400).json({ message: 'You cannot remove your own admin role' });
        }

        const updates = {};
        if (role) updates.role = role;
        if (password) {
            if (password.length < 8) {
                return res.status(400).json({ message: 'Password must be at least 8 characters' });
            }
            if (!/[A-Z]/.test(password)) {
                return res.status(400).json({ message: 'Password must contain at least one uppercase letter' });
            }
            if (!/[a-z]/.test(password)) {
                return res.status(400).json({ message: 'Password must contain at least one lowercase letter' });
            }
            if (!/[^A-Za-z0-9]/.test(password)) {
                return res.status(400).json({ message: 'Password must contain at least one special character' });
            }
            updates.passwordHash = await bcrypt.hash(password, 10);
        }

        const user = await User.findByIdAndUpdate(id, updates, { new: true })
            .select('_id email role lastLoginAt createdAt');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User updated', user });
    } catch (error) {
        console.error('UPDATE USER ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a user by ID. Admins can delete other users but cannot delete themselves. The endpoint checks if the user exists before attempting to delete and returns appropriate responses based on the outcome.
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.id.toString() === id) {
            return res.status(400).json({ message: 'You cannot delete yourself' });
        }

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully', id });
    } catch (error) {
        console.error('DELETE USER ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
};