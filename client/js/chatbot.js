// Chatbot Widget - Floating Chat at bottom right
const ChatbotWidget = (() => {
    let isOpen = false;
    let userId = null;
    let isAdmin = false;

    const init = () => {
        // Get or create userId
        userId = localStorage.getItem('chatbotUserId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('chatbotUserId', userId);
        }

        // Check if user is admin
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                isAdmin = user.role === 'admin';
            } catch (e) {
                isAdmin = false;
            }
        }

        createChatWidget();
        attachEventListeners();
        loadChatHistory();
    };

    const createChatWidget = () => {
        // Chat widget HTML
        const chatHTML = `
            <!-- Chat Widget Container -->
            <div id="chatbot-container" class="chatbot-container hidden">
                <!-- Chat Header -->
                <div class="chatbot-header">
                    <div class="chatbot-title">
                        <i class="fa fa-comments"></i> FitShoes Assistant
                    </div>
                    <button id="chatbot-close" class="chatbot-close-btn" title="Close">
                        <i class="fa fa-times"></i>
                    </button>
                </div>

                <!-- Chat Messages -->
                <div id="chatbot-messages" class="chatbot-messages">
                    <div class="chatbot-message bot-message">
                        <div class="message-content">
                            👋 Xin chào! Tôi là FitShoes AI Assistant. Tôi có thể giúp bạn:
                            <ul style="margin-top: 0.5rem; text-align: left;">
                                <li>🔍 Tìm sản phẩm phù hợp</li>
                                <li>💬 Trả lời câu hỏi về cửa hàng</li>
                                ${isAdmin ? '<li>⚙️ Quản lý sản phẩm (Admin)</li>' : ''}
                            </ul>
                        </div>
                        <div class="message-time">${new Date().toLocaleTimeString('vi-VN')}</div>
                    </div>
                </div>

                <!-- Chat Input -->
                <div class="chatbot-input-area">
                    <input 
                        type="text" 
                        id="chatbot-input" 
                        class="chatbot-input" 
                        placeholder="Nhập tin nhắn..." 
                        autocomplete="off"
                    />
                    <button id="chatbot-send" class="chatbot-send-btn" title="Send">
                        <i class="fa fa-paper-plane"></i>
                    </button>
                </div>
            </div>

            <!-- Chat Toggle Button (Small Circle) -->
            <button id="chatbot-toggle-btn" class="chatbot-toggle-btn" title="Open Chat">
                <i class="fa fa-comments"></i>
            </button>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);

        // Add CSS if not already added
        if (!document.getElementById('chatbot-styles')) {
            const style = document.createElement('style');
            style.id = 'chatbot-styles';
            style.textContent = getChatbotCSS();
            document.head.appendChild(style);
        }
    };

    const getChatbotCSS = () => {
        return `
        /* Chatbot Widget Styles */
        .chatbot-container {
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 380px;
            height: 550px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
            display: flex;
            flex-direction: column;
            font-family: 'Be Vietnam Pro', sans-serif;
            z-index: 10000;
            animation: slideUp 0.3s ease;
            border: 1px solid #e0e0e0;
            transition: all 0.3s ease;
        }

        .chatbot-container.hidden {
            display: none;
            animation: slideDown 0.3s ease;
        }

        .chatbot-header {
            background: linear-gradient(135deg, #153356 0%, #667eea 100%);
            color: white;
            padding: 1.2rem;
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .chatbot-title {
            font-size: 1rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .chatbot-close-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            cursor: pointer;
            font-size: 1.2rem;
            padding: 0.5rem;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }

        .chatbot-close-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .chatbot-messages {
            flex: 1;
            overflow-y: auto;
            padding: 1.2rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            background: #f9f9f9;
        }

        .chatbot-message {
            display: flex;
            flex-direction: column;
            animation: fadeInUp 0.3s ease;
        }

        .chatbot-message.user-message {
            align-items: flex-end;
        }

        .chatbot-message.bot-message {
            align-items: flex-start;
        }

        .message-content {
            max-width: 85%;
            padding: 0.8rem 1rem;
            border-radius: 12px;
            word-wrap: break-word;
            line-height: 1.5;
            font-size: 0.95rem;
        }

        .user-message .message-content {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border-bottom-right-radius: 4px;
        }

        .bot-message .message-content {
            background: white;
            color: #333;
            border: 1px solid #e0e0e0;
            border-bottom-left-radius: 4px;
        }

        .message-time {
            font-size: 0.75rem;
            color: #999;
            margin-top: 0.3rem;
            padding: 0 0.5rem;
        }

        .chatbot-input-area {
            display: flex;
            gap: 0.5rem;
            padding: 1rem;
            background: white;
            border-top: 1px solid #eee;
            border-radius: 0 0 12px 12px;
        }

        .chatbot-input {
            flex: 1;
            border: 1px solid #ddd;
            border-radius: 24px;
            padding: 0.8rem 1rem;
            font-size: 0.95rem;
            font-family: 'Be Vietnam Pro', sans-serif;
            outline: none;
            transition: all 0.3s ease;
        }

        .chatbot-input:focus {
            border-color: #667eea;
            box-shadow: 0 0 8px rgba(102, 126, 234, 0.2);
        }

        .chatbot-send-btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            font-size: 1rem;
        }

        .chatbot-send-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .chatbot-send-btn:active {
            transform: translateY(0);
        }

        .chatbot-send-btn.loading {
            opacity: 0.6;
            pointer-events: none;
        }

        /* Toggle Button (Small Circle) */
        #chatbot-toggle-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.5rem;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            z-index: 9999;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #chatbot-toggle-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }

        #chatbot-toggle-btn:active {
            transform: scale(0.95);
        }

        /* Animations */
        @keyframes slideUp {
            from {
                transform: translateY(20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        @keyframes slideDown {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(20px);
                opacity: 0;
            }
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Responsive */
        @media (max-width: 480px) {
            .chatbot-container {
                width: calc(100vw - 20px);
                height: 70vh;
                bottom: 80px;
                right: 10px;
            }

            .chatbot-header {
                border-radius: 12px 12px 0 0;
            }

            .chatbot-input-area {
                border-radius: 0 0 12px 12px;
            }

            #chatbot-toggle-btn {
                bottom: 20px;
                right: 20px;
            }

            .message-content {
                max-width: 100%;
            }
        }

        /* Scrollbar styling */
        .chatbot-messages::-webkit-scrollbar {
            width: 6px;
        }

        .chatbot-messages::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }

        .chatbot-messages::-webkit-scrollbar-thumb {
            background: #667eea;
            border-radius: 10px;
        }

        .chatbot-messages::-webkit-scrollbar-thumb:hover {
            background: #764ba2;
        }
        `;
    };

    const attachEventListeners = () => {
        // Toggle chat open/close
        document.getElementById('chatbot-toggle-btn').addEventListener('click', toggleChat);
        document.getElementById('chatbot-close').addEventListener('click', toggleChat);

        // Send message
        document.getElementById('chatbot-send').addEventListener('click', sendMessage);
        document.getElementById('chatbot-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    };

    const toggleChat = () => {
        const container = document.getElementById('chatbot-container');
        isOpen = !isOpen;
        
        if (isOpen) {
            container.classList.remove('hidden');
            document.getElementById('chatbot-input').focus();
        } else {
            container.classList.add('hidden');
        }
    };

    const sendMessage = async () => {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();

        if (!message) return;

        // Add user message to chat
        addMessage(message, 'user');
        input.value = '';

        // Show loading state
        const sendBtn = document.getElementById('chatbot-send');
        sendBtn.classList.add('loading');

        try {
            // Send to backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    userId,
                    isAdmin
                })
            });

            const data = await response.json();

            if (data.success) {
                addMessage(data.message, 'bot');
            } else {
                // Show error message from server
                const errorMsg = data.error || '⚠️ Có lỗi xảy ra. Vui lòng thử lại.';
                addMessage(errorMsg, 'bot');
                console.error('Chat API error:', data);
            }
        } catch (error) {
            console.error('Chat error:', error);
            addMessage('❌ Lỗi kết nối. Kiểm tra console để xem chi tiết.', 'bot');
        } finally {
            sendBtn.classList.remove('loading');
            input.focus();
        }
    };

    const addMessage = (text, sender) => {
        const messagesDiv = document.getElementById('chatbot-messages');
        const messageEl = document.createElement('div');
        messageEl.className = `chatbot-message ${sender}-message`;

        const time = new Date().toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        messageEl.innerHTML = `
            <div class="message-content">${escapeHtml(text)}</div>
            <div class="message-time">${time}</div>
        `;

        messagesDiv.appendChild(messageEl);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        // Save to localStorage
        saveChatMessage(text, sender);
    };

    const saveChatMessage = (text, sender) => {
        let history = JSON.parse(localStorage.getItem('chatbotHistory') || '[]');
        history.push({
            text,
            sender,
            timestamp: new Date().toISOString()
        });
        // Keep only last 50 messages
        if (history.length > 50) {
            history = history.slice(-50);
        }
        localStorage.setItem('chatbotHistory', JSON.stringify(history));
    };

    const loadChatHistory = () => {
        const history = JSON.parse(localStorage.getItem('chatbotHistory') || '[]');
        const messagesDiv = document.getElementById('chatbot-messages');

        // Clear initial message if there's history
        const initMessages = messagesDiv.querySelectorAll('.chatbot-message');
        if (initMessages.length === 1 && history.length > 0) {
            initMessages[0].remove();
        }

        // Add history
        history.forEach(msg => {
            const messageEl = document.createElement('div');
            messageEl.className = `chatbot-message ${msg.sender}-message`;
            const time = new Date(msg.timestamp).toLocaleTimeString('vi-VN');

            messageEl.innerHTML = `
                <div class="message-content">${escapeHtml(msg.text)}</div>
                <div class="message-time">${time}</div>
            `;
            messagesDiv.appendChild(messageEl);
        });

        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    };

    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    return {
        init
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ChatbotWidget.init);
} else {
    ChatbotWidget.init();
}
