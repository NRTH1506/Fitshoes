const express = require('express');
const router = express.Router();

// OpenAI API setup
const OpenAI = require('openai');

// Check if API key exists
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.apiKey;
if (!OPENAI_API_KEY) {
    console.error('⚠️ WARNING: OPENAI_API_KEY not found in environment variables');
}

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
});

// Store conversation history
const conversationHistory = {};

// Get product data
let products = [];
try {
    const fs = require('fs');
    products = JSON.parse(fs.readFileSync('./static-products.json', 'utf8'));
} catch (err) {
    console.log('Products file not found, using empty array');
}

// System prompt for the AI
const SYSTEM_PROMPT = `You are a helpful AI assistant for FitShoes, a premium shoe e-commerce store. 

Your responsibilities:
1. Help customers find shoes by describing what they're looking for
2. Provide product information (name, price, description)
3. Answer questions about shipping, returns, and store policies
4. For ADMIN commands (if user is admin), help manage inventory

Available products:
${JSON.stringify(products.slice(0, 5).map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    description: p.description
})), null, 2)}

Guidelines:
- Be friendly and helpful
- If customer wants to search for products, ask specific questions to narrow down (size, style, budget)
- If admin wants to manage products, ask for specific details (name, price, description, image)
- Always confirm actions before executing
- Respond in Vietnamese if customer uses Vietnamese

For admin commands, recognize these patterns:
- "thêm sản phẩm" (add product)
- "sửa sản phẩm" (edit product)
- "xóa sản phẩm" (delete product)
- "danh sách sản phẩm" (list products)`;

// Chat endpoint
router.post('/chat', async (req, res) => {
    try {
        const { message, userId, isAdmin } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Initialize conversation history for user if not exists
        if (!conversationHistory[userId]) {
            conversationHistory[userId] = [];
        }

        // Add user message to history
        conversationHistory[userId].push({
            role: 'user',
            content: message
        });

        // Keep only last 10 messages for context
        const recentHistory = conversationHistory[userId].slice(-10);

        // Call OpenAI API
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: SYSTEM_PROMPT + (isAdmin ? '\n\nNOTE: This user is an ADMIN with special privileges.' : '')
                },
                ...recentHistory
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        const assistantMessage = response.choices[0].message.content;

        // Add assistant response to history
        conversationHistory[userId].push({
            role: 'assistant',
            content: assistantMessage
        });

        res.json({
            success: true,
            message: assistantMessage,
            timestamp: new Date()
        });

    } catch (error) {
        console.error('Chatbot error:', error);
        console.error('Error message:', error.message);
        console.error('Error status:', error.status);
        
        let errorMessage = 'Failed to process chat message';
        
        // Handle specific OpenAI errors
        if (error.status === 401) {
            errorMessage = '❌ API Key không hợp lệ hoặc hết hạn. Vui lòng kiểm tra OPENAI_API_KEY.';
            console.error('⚠️ OpenAI API Key issue detected');
        } else if (error.status === 429) {
            errorMessage = '⏳ Quá nhiều request. Vui lòng đợi một chút.';
        } else if (error.status === 500) {
            errorMessage = '❌ OpenAI Server lỗi. Vui lòng thử lại sau.';
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = '❌ Không thể kết nối đến OpenAI. Kiểm tra internet.';
        }
        
        res.status(500).json({
            success: false,
            error: errorMessage,
            details: error.message
        });
    }
});

// Clear chat history
router.post('/chat/clear', (req, res) => {
    const { userId } = req.body;
    if (conversationHistory[userId]) {
        delete conversationHistory[userId];
    }
    res.json({ success: true, message: 'Chat history cleared' });
});

module.exports = router;
