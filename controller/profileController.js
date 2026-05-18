const User = require('../model/User');

// Profile controller for handling user profile related operations
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('email profile');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ profile: user.profile, email: user.email });
    } catch (error) {
        console.error('GET PROFILE ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, goal, diet, allergies } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { profile: { name, goal, diet, allergies } },
            { new: true }
        ).select('email profile');

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'Profile updated', profile: user.profile });
    } catch (error) {
        console.error('UPDATE PROFILE ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
};