const { GoogleGenAI } = require('@google/genai');

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

        res.json(data);

    } catch (error) {
        console.error('ANALYZE ERROR:', error);
        res.status(500).json({ message: 'Failed to analyze image' });
    }
};