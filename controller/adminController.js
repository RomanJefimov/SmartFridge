const User = require('../model/User');

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({}, '_id email role lastLoginAt createdAt');
        res.json({ users });
    } catch (error) {
        console.error('GET USERS ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent admin from deleting themselves
        if (req.user._id.toString() === id) {
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