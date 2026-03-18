import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Global styles — order matters
import './styles/style.css'
import './styles/utils.css'
import './styles/media-queries.css'
import './styles/responsive.css'

// Chatbot styles (injected by ChatbotWidget but we add base CSS here)
import './styles/chatbot.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
