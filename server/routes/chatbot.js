const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Product = require('../models/Product');

// --- 1. Gemini API setup ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error('⚠️ WARNING: GEMINI_API_KEY not found in environment variables');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// --- 2. Free-tier models ordered by quota availability ---
const FREE_MODELS = [
    'gemini-3.1-flash-lite',   // 15 RPM, 500 RPD — best free quota
    'gemini-2.5-flash-lite',   // 10 RPM, 20 RPD
    'gemini-3.0-flash',        // 5 RPM, 20 RPD
    'gemini-2.5-flash',        // 5 RPM, 20 RPD
];

// Track which model to use (start with best)
let currentModelIndex = 0;

function getCurrentModelName() {
    return FREE_MODELS[currentModelIndex % FREE_MODELS.length];
}

function rotateModel() {
    currentModelIndex = (currentModelIndex + 1) % FREE_MODELS.length;
    console.log(`[Chatbot] Rotated to model: ${getCurrentModelName()}`);
    return getCurrentModelName();
}

// --- 3. System Instructions template ---
const SYSTEM_PROMPT_BASE = `You are a helpful AI assistant for FitShoes, a premium shoe e-commerce store. 

Your responsibilities:
1. Help customers find shoes by describing what they're looking for.
2. Provide product information (name, price, description).
3. Answer questions about shipping, returns, and store policies.
4. For ADMIN commands (if user is admin), help manage inventory.
5. IMPORTANT: Tell customers that they MUST log in or register an account to place an order. Guest checkout is NOT supported.

Guidelines:
- Be friendly and helpful.
- Respond in Vietnamese if customer uses Vietnamese.
- Stay concise but ALWAYS complete your sentences.
- Do not truncate your responses. If there are many products, list the top 5 relevant ones and ask if the user wants to see more.
- ALWAYS use the live product data provided below for availability and pricing.`;

// Store conversation history in memory
const conversationHistory = {};

// --- 4. Helper: try sending message with automatic model fallback ---
async function sendWithFallback(dynamicSystemPrompt, history, message, retriesLeft = FREE_MODELS.length) {
    const modelName = getCurrentModelName();
    console.log(`[Chatbot] Using model: ${modelName}`);

    const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: dynamicSystemPrompt
    });

    const chat = model.startChat({
        history: history,
        generationConfig: { maxOutputTokens: 800 },
    });

    try {
        const result = await chat.sendMessage(message);
        return result.response.text();
    } catch (error) {
        // On 429 (quota) or 404 (model not found), try the next model
        if ((error.status === 429 || error.status === 404) && retriesLeft > 1) {
            console.warn(`[Chatbot] Model ${modelName} failed (${error.status}), rotating...`);
            rotateModel();
            return sendWithFallback(dynamicSystemPrompt, history, message, retriesLeft - 1);
        }
        throw error; // All models exhausted or different error
    }
}

// --- 5. Chat endpoint ---
router.post('/chat', async (req, res) => {
    try {
        const { message, userId, isAdmin } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // --- Fetch LIVE product data from MongoDB ---
        let currentProducts = [];
        try {
            currentProducts = await Product.find({}).lean();
        } catch (dbErr) {
            console.error('Failed to fetch live products:', dbErr);
        }

        const productInfo = currentProducts.slice(0, 50).map(p => ({
            name: p.title_vi || p.title,
            price: p.price,
            description: p.description_vi,
            gender: p.gender
        }));

        const dynamicSystemPrompt = `${SYSTEM_PROMPT_BASE}\n\nLive Product Inventory:\n${JSON.stringify(productInfo, null, 2)}`;

        console.log(`[Chatbot] Message from ${userId}: "${message}"`);

        // Initialize conversation history for user if not exists
        if (!conversationHistory[userId]) {
            conversationHistory[userId] = [];
        }

        // Keep last 10 messages for history
        const history = conversationHistory[userId].slice(-10).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        // Send with automatic model fallback
        const assistantMessage = await sendWithFallback(dynamicSystemPrompt, history, message);

        console.log(`[Chatbot] Response (${getCurrentModelName()}): "${assistantMessage.substring(0, 50)}..."`);

        // Add to local history
        conversationHistory[userId].push({ role: 'user', content: message });
        conversationHistory[userId].push({ role: 'assistant', content: assistantMessage });

        // Return 'reply' to match frontend ChatbotWidget.jsx
        res.json({
            success: true,
            reply: assistantMessage,
            model: getCurrentModelName(),
            timestamp: new Date()
        });

    } catch (error) {
        console.error('Gemini Chatbot error:', error);

        let errorMessage = 'Failed to process chat message';
        if (error.message && error.message.includes('API_KEY_INVALID')) {
            errorMessage = '❌ API Key Gemini không hợp lệ.';
        } else if (error.status === 429) {
            errorMessage = '⏳ Tất cả model đều hết hạn mức. Vui lòng thử lại sau vài phút.';
        } else if (error.status === 404) {
            errorMessage = '❌ Không tìm thấy model AI phù hợp.';
        }

        res.status(500).json({
            success: false,
            error: errorMessage,
            details: error.message
        });
    }
});

// --- 6. Clear chat history ---
router.post('/chat/clear', (req, res) => {
    const { userId } = req.body;
    if (conversationHistory[userId]) {
        delete conversationHistory[userId];
    }
    res.json({ success: true, message: 'Chat history cleared' });
});

module.exports = router;
