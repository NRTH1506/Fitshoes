# 🏃 FitShoes — E-Commerce Shoe Store

A full-stack e-commerce platform for athletic shoes built with **React**, **Node.js/Express**, and **MongoDB**. Features secure authentication with OTP verification, Google Sign-In, ZaloPay payment integration, an AI-powered chatbot, and comprehensive admin tools.

## ✨ Features

### 🛍️ Shopping
- Product catalog with gender-based filtering (Nam / Nữ / Unisex)
- Product detail pages with image gallery, size selection, and quantity controls
- Shopping cart with real-time price calculation and free shipping threshold
- ZaloPay sandbox payment integration

### 🔐 Security & Authentication
- Email/password registration with **OTP email verification**
- **Google Sign-In** (OAuth 2.0)
- Password hashing with **bcrypt**
- Rate limiting on auth endpoints (`express-rate-limit`)
- Secure HTTP headers via **Helmet**
- CORS configuration with environment-based allowed origins

### 🤖 AI Chatbot
- OpenAI-powered customer assistant
- Product search and store policy Q&A
- Conversation history persistence
- Admin-aware command handling

### 📊 Admin & Monitoring
- Product management (add/delete)
- Structured JSON logging (HTTP, auth, audit, errors)
- Log viewer with filtering, search, and pagination

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, React Router 7 |
| **Backend** | Node.js, Express 4 |
| **Database** | MongoDB (Mongoose 7) |
| **Auth** | bcrypt, Google OAuth, OTP (Nodemailer) |
| **Payments** | ZaloPay Sandbox |
| **AI** | OpenAI GPT-3.5 Turbo |
| **Security** | Helmet, express-rate-limit, CORS |

## 📁 Project Structure

```
Fitshoes/
├── client/                  # React frontend (Vite)
│   ├── public/assets/       # Images and static assets
│   └── src/
│       ├── components/      # Navbar, Footer, ChatbotWidget, Layout, ErrorBoundary
│       ├── contexts/        # AuthContext, CartContext
│       ├── pages/           # 13 page components
│       ├── services/        # Centralized API client
│       ├── styles/          # Global CSS + media queries
│       └── utils/           # formatPrice, toast
├── server/                  # Express API backend
│   ├── middleware/           # HTTP, auth, audit, error loggers
│   ├── models/              # Mongoose models
│   ├── routes/              # Admin, chatbot routes
│   ├── server.js            # Main server (auth, products, payments, logs)
│   └── .env.example         # Environment variable template
└── client-legacy/           # Original HTML/CSS/JS (pre-React)
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **MongoDB** (local or [Atlas](https://www.mongodb.com/atlas))

### 1. Clone the repo
```bash
git clone https://github.com/your-username/Fitshoes.git
cd Fitshoes
```

### 2. Set up the backend
```bash
cd server
cp .env.example .env        # Edit with your credentials
npm install
npm start                   # Runs on http://localhost:8081
```

### 3. Set up the frontend
```bash
cd client
npm install
npm run dev                 # Runs on http://localhost:5173
```

The Vite dev server proxies `/api` requests to `localhost:8081` automatically.

### Environment Variables

See [`server/.env.example`](server/.env.example) for all required variables:
- `MONGO_URI` — MongoDB connection string
- `GOOGLE_CLIENT_ID` — Google OAuth client ID
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` — For OTP emails
- `OPENAI_API_KEY` — For the AI chatbot
- `ZALOPAY_*` — Payment gateway config
- `FE_ORIGINS` — Allowed frontend origins (CORS)

## 🌐 Deployment

| Service | Platform | Config |
|---------|----------|--------|
| Frontend | **Vercel** | Framework: Vite, Env: `VITE_API_URL` |
| Backend | **Render** | Root: `server/`, Start: `node server.js` |
| Database | **MongoDB Atlas** | Free tier (512MB) |

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/register` | User registration |
| `POST` | `/api/login` | Login (returns OTP requirement) |
| `POST` | `/api/login-google` | Google OAuth login |
| `POST` | `/api/verify-otp` | OTP verification |
| `POST` | `/api/resend-otp` | Resend OTP code |
| `GET` | `/api/products` | List all products |
| `GET` | `/api/products/:id` | Product details |
| `POST` | `/api/products/add` | Add product (admin) |
| `DELETE` | `/api/products/:id` | Delete product (admin) |
| `PUT` | `/api/profile` | Update user profile |
| `POST` | `/api/pay/zalopay` | Create ZaloPay order |
| `POST` | `/api/chat` | AI chatbot message |
| `GET` | `/api/logs` | View system logs |

## 📄 License

This project is for educational and portfolio purposes.

---

Built with ❤️ by Thanh Hoang Nguyen
# Fitshoes
