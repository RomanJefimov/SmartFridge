const User = require('../model/User');

module.exports = async (req, res, next) => {
    const email = req.headers['x-user-email'];

    if (!email) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findOne({ email });

    if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    req.user = user;
    next();
};