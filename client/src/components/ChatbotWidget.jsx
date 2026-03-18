import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { sendChatMessage } from '../services/api';

export default function ChatbotWidget() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'bot', text: t('chatbot.welcome') }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await sendChatMessage(text, user?._id || user?.id || 'guest');
      setMessages((prev) => [...prev, { role: 'bot', text: res.data?.reply || '...' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', text: '❌ Error' }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button className="chatbot-toggle-btn" onClick={() => setOpen(true)} aria-label="Chat">
        <i className="fa fa-comments"></i>
      </button>
    );
  }

  return (
    <>
      <div className="chatbot-container">
        <div className="chatbot-header">
          <div className="chatbot-title"><i className="fa fa-robot"></i> {t('chatbot.title')}</div>
          <button className="chatbot-close-btn" onClick={() => setOpen(false)}>✕</button>
        </div>
        <div className="chatbot-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chatbot-message ${m.role === 'user' ? 'user-message' : 'bot-message'}`}>
              <div className="message-content">{m.text}</div>
            </div>
          ))}
          {loading && (
            <div className="chatbot-message bot-message">
              <div className="message-content">...</div>
            </div>
          )}
        </div>
        <div className="chatbot-input-area">
          <input
            className="chatbot-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('chatbot.placeholder')}
          />
          <button className={`chatbot-send-btn ${loading ? 'loading' : ''}`} onClick={handleSend}>
            <i className="fa fa-paper-plane"></i>
          </button>
        </div>
      </div>
      <button className="chatbot-toggle-btn" onClick={() => setOpen(false)}>
        <i className="fa fa-times"></i>
      </button>
    </>
  );
}
