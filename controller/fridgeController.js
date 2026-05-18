const { GoogleGenAI } = require('@google/genai');
const FridgeHistory = require('../model/FridgeHistory');
const User = require('../model/User');

// Fridge controller for handling fridge-related operations such as analyzing uploaded images of the fridge contents, generating recipes based on the detected products, and managing the user's fridge history. The analyzeImage endpoint processes the uploaded image using Google Gemini AI to extract product information, generate recipes, and provide nutritional analysis, while also taking into account the user's profile preferences. The history endpoints allow users to view their past fridge analyses and update product information as needed.
function buildProfileContext(profile) {
    if (!profile) return '';

    const parts = [];

    if (profile.name) parts.push(`User's name: ${profile.name}.`);

    if (profile.goal) {
        const goals = {
            weight_loss: 'weight loss',
            muscle_gain: 'muscle gain',
            healthy_eating: 'healthy eating'
        };
        parts.push(`Nutrition goal: ${goals[profile.goal] || profile.goal}.`);
    }

    if (profile.diet && profile.diet !== 'none') {
        parts.push(`Diet type: ${profile.diet}.`);
    }

    if (profile.allergies && profile.allergies.length > 0) {
        parts.push(`Allergies (MUST avoid): ${profile.allergies.join(', ')}.`);
    }

    return parts.length > 0 ? `\nUser preferences:\n${parts.join('\n')}\nTake these preferences into account when generating recipes and analysis.\n` : '';
}

// Analyze the uploaded fridge image, extract product information, generate recipes, and provide nutritional analysis using Google Gemini AI. The endpoint expects an image file upload and uses the user's profile information to generate more personalized results. The extracted data is stored in the FridgeHistory collection for future reference.
exports.analyzeImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        const user = await User.findById(req.user.id).select('profile');
        const profileContext = buildProfileContext(user?.profile);

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const prompt = `You are a JSON generator. Analyze this fridge image and respond with ONLY a valid JSON object. No text before or after. No markdown. No backticks. No comments. Just pure JSON.
${profileContext}
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
            products: data.products.map(name => ({ name, expiryDate: null })),
            recipes: data.recipes,
            analysis: data.analysis
        });

        res.json(data);

    } catch (error) {
        console.error('ANALYZE ERROR:', error);
        res.status(500).json({ message: 'Failed to analyze image' });
    }
};

// Get the user's fridge history, including past products, recipes, and analysis. The endpoint retrieves all entries from the FridgeHistory collection for the authenticated user, sorted by creation date in descending order, allowing the user to review their past fridge analyses and generated recipes.
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

// Get the latest fridge history entry for the user. This endpoint retrieves the most recent entry from the FridgeHistory collection for the authenticated user, allowing the user to quickly access their latest fridge analysis and generated recipes.
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

// Update the products for a specific fridge history entry. This endpoint allows the user to update the list of products for a given entry in their fridge history, which can be useful if the AI's initial product detection was inaccurate or if the user wants to add expiry dates for better tracking.
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

// Update the recipes for a specific fridge history entry by re-analyzing the products with Google Gemini AI. This endpoint allows the user to generate new recipes based on the updated list of products, taking into account their profile preferences for more personalized results.
exports.updateRecipes = async (req, res) => {
    try {
        const { id, products } = req.body;

        const user = await User.findById(req.user.id).select('profile');
        const profileContext = buildProfileContext(user?.profile);

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const productNames = products.map(p => typeof p === 'string' ? p : p.name);
        const prompt = `You are a JSON generator. Based on these products: ${productNames.join(', ')}.
            ${profileContext}
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

// Get notifications for products that are expiring soon or have already expired based on the latest fridge history entry. This endpoint checks the expiry dates of the products in the most recent fridge history entry and returns notifications for any products that are expiring within the next day or have already expired, helping users stay informed about their fridge contents.
exports.getNotifications = async (req, res) => {
    try {
        const latest = await FridgeHistory.findOne({ userId: req.user.id })
            .sort({ createdAt: -1 });
        if (!latest) return res.json({ notifications: [] });
        const now = new Date();
        const notifications = [];
        for (const product of latest.products) {
            if (!product.expiryDate) continue;
            const expiry = new Date(product.expiryDate);
            const diffMs = expiry - now;
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            if (diffDays < 0) {
                notifications.push({
                    name: product.name,
                    status: 'expired',
                    message: `${product.name} has expired!`
                });
            } else if (diffDays <= 1) {
                notifications.push({
                    name: product.name,
                    status: 'expiring',
                    message: `${product.name} expires tomorrow!`
                });
            }
        }
        res.json({ notifications });
    } catch (error) {
        console.error('NOTIFICATIONS ERROR:', error);
        res.status(500).json({ message: 'Failed to get notifications' });
    }
};