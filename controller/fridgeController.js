const { GoogleGenAI } = require('@google/genai');
const FridgeHistory = require('../model/FridgeHistory');

exports.analyzeImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const prompt = `Analyze this fridge image and respond ONLY with a JSON object, no markdown, no backticks, just raw JSON:
        {
            "products": ["list of products you see"],
            "recipes": [
                {
                    "name": "recipe name",
                    "ingredients": ["ingredient1", "ingredient2"],
                    "steps": ["step1", "step2"]
                }
            ],
            "analysis": {
                "calories": "estimated total calories",
                "proteins": "protein level: low/medium/high",
                "carbs": "carbs level: low/medium/high",
                "fats": "fat level: low/medium/high",
                "vegetables": "vegetable level: low/medium/high",
                "tip": "one short nutrition tip"
            }
        }`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: req.file.mimetype,
                                data: req.file.buffer.toString('base64')
                            }
                        }
                    ]
                }
            ]
        });

        const text = response.text.trim();
        const clean = text.replace(/```json|```/g, '').trim();
        const data = JSON.parse(clean);

        await FridgeHistory.create({
            userId: req.user.id,
            products: data.products,
            recipes: data.recipes,
            analysis: data.analysis
        });

        res.json(data);

    } catch (error) {
        console.error('ANALYZE ERROR:', error);
        res.status(500).json({ message: 'Failed to analyze image' });
    }
};

// All history for user
exports.getHistory = async (req, res) => {
    try {
        const history = await FridgeHistory.find({ userId: req.user.id })
            .sort({ createdAt: -1 }); // новые первыми
        res.json({ history });
    } catch (error) {
        console.error('HISTORY ERROR:', error);
        res.status(500).json({ message: 'Failed to get history' });
    }
};

// Get the latest entry
exports.getLatest = async (req, res) => {
    try {
        const latest = await FridgeHistory.findOne({ userId: req.user.id })
            .sort({ createdAt: -1 });
        res.json({ latest });
    } catch (error) {
        console.error('LATEST ERROR:', error);
        res.status(500).json({ message: 'Failed to get latest' });
    }
};

// Update products in an existing entry
exports.updateProducts = async (req, res) => {
    try {
        const { id, products } = req.body;

        const entry = await FridgeHistory.findOneAndUpdate(
            { _id: id, userId: req.user.id },
            { products },
            { new: true }
        );

        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        res.json({ message: 'Products updated', entry });
    } catch (error) {
        console.error('UPDATE PRODUCTS ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update recipes in an existing entry
exports.updateRecipes = async (req, res) => {
    try {
        const { id, products } = req.body;

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const prompt = `Based on these products: ${products.join(', ')}
        Generate recipes and respond ONLY with a JSON array, no markdown, no backticks:
        [
            {
                "name": "recipe name",
                "ingredients": ["ingredient1", "ingredient2"],
                "steps": ["step1", "step2"]
            }
        ]`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }]
        });

        const text = response.text.trim();
        const clean = text.replace(/```json|```/g, '').trim();
        const recipes = JSON.parse(clean);

        const entry = await FridgeHistory.findOneAndUpdate(
            { _id: id, userId: req.user.id },
            { recipes },
            { new: true }
        );

        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        res.json({ message: 'Recipes updated', recipes });
    } catch (error) {
        console.error('UPDATE RECIPES ERROR:', error);
        res.status(500).json({ message: 'Server error' });
    }
};