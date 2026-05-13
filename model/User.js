const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    lastLoginAt: {
        type: Date
    },
    profile: {
        name: { type: String, default: '' },
        goal: {
            type: String,
            enum: ['weight_loss', 'muscle_gain', 'healthy_eating', ''],
            default: ''
        },
        diet: {
            type: String,
            enum: ['none', 'vegetarian', 'vegan'],
            default: 'none'
        },
        allergies: {
            type: [String],
            default: []
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);