const mongoose = require('mongoose');

const fridgeHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [
        {
            name: { type: String, required: true },
            expiryDate: { type: Date, default: null }
        }
    ],
    recipes: [
        {
            name: String,
            ingredients: [String],
            steps: [String]
        }
    ],
    analysis: {
        calories: String,
        proteins: String,
        carbs: String,
        fats: String,
        vegetables: String,
        tip: String
    }
}, { timestamps: true });

module.exports = mongoose.model('FridgeHistory', fridgeHistorySchema);