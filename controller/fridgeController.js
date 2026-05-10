const { GoogleGenAI } = require('@google/genai');
const FridgeHistory = require('../model/FridgeHistory');

exports.analyzeImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const prompt = `You are a JSON generator. Analyze this fridge image and respond with ONLY a valid JSON object. No text before or after. No markdown. No backticks. No comments. Just pure JSON.
            {
                "products": ["product1", "product2"],
                "recipes": [
                    {
                        "name": "recipe name",
                        "ingredients": ["ingredient1", "ingredient2"],
                        "steps": ["step1", "step2"]
                    }
                ],
                "analysis": {
                    "calories": "low/medium/high",
                    "proteins": "low/medium/high",
                    "carbs": "low/medium/high",
                    "fats": "low/medium/high",
                    "vegetables": "low/medium/high",
                    "tip": "one short tip"
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
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('No JSON found in response:', text);
            return res.status(500).json({ message: 'AI returned invalid response' });
        }
        const data = JSON.parse(jsonMatch[0]);

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

exports.getHistory = async (req, res) => {
    try {
        const history = await FridgeHistory.find({ userId: req.user.id })
            .sort({ createdAt: -1 });
        res.json({ history });
    } catch (error) {
        console.error('HISTORY ERROR:', error);
        res.status(500).json({ message: 'Failed to get history' });
    }
};

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

exports.updateRecipes = async (req, res) => {
    try {
        const { id, products } = req.body;

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const prompt = `You are a JSON generator. Based on these products: ${products.join(', ')}.
            Generate recipes and respond with ONLY a valid JSON array. No text before or after. No markdown. No backticks. Just pure JSON array.
                
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
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.error('No JSON found in response:', text);
            return res.status(500).json({ message: 'AI returned invalid response' });
        }
        const recipes = JSON.parse(jsonMatch[0]);

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