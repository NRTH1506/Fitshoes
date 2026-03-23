# FitShoes

FitShoes is a modern, full-stack e-commerce application for footwear, built with a React frontend and an Express/MongoDB backend. It features a premium UI inspired by top brands (Adidas mega-dropdowns, Nike-style shop pages), a comprehensive admin dashboard, advanced product filtering, per-size inventory management, ZaloPay payment integration, and an AI-powered shopping assistant.

## Tech Stack

- **Frontend:** React, Vite, React Router, Context API
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Auth:** JWT, OTP email verification, Google OAuth
- **Payments:** ZaloPay sandbox integration
- **AI Integration:** OpenAI / Gemini-backed chatbot

## Key Features

### 🛍️ User Experience
- **Premium UI:** Adidas-style mega dropdown navigation and Nike-style shop rendering.
- **Advanced Filtering:** Filter products by category (Running, Gym, Casual, etc.), gender, specific sizes, and active sales.
- **Dynamic Product Pages:** Real-time stock checking per size, dynamic sale pricing, and interactive image galleries.
- **Seamless Checkout:** Guest users are smoothly redirected to log in and automatically returned to their cart context.
- **Profile Management:** Users can update details and upload custom avatars.
- **AI Shopping Assistant:** Built-in AI chatbot to help users find the perfect fit and answer store questions.

### 🛡️ Admin Dashboard
- **Shop Management:** Full CRUD operations for products, including image uploads, categorizations, and detailed per-size inventory tracking (e.g., specific stock for size 40, size 41).
- **Sale Campaigns:** Set global or product-specific sale prices and expirations easily. 
- **Order Tracking:** Track revenue, search by transaction ID, filter by date/status, and update fulfillment status directly.
- **User Management:** View detailed profiles, sort users, delete accounts, and securely grant/revoke admin privileges or transfer store ownership.
- **Activity & Audit Logs:** A comprehensive logging system tracking every administrative action (who, what, when, IP address) for security and accountability.

## Project Structure

```text
Fitshoes-main/
├─ client/
│  ├─ public/
│  └─ src/
│     ├─ components/
│     ├─ contexts/
│     ├─ i18n/
│     ├─ pages/
│     ├─ services/
│     ├─ styles/
│     └─ utils/
├─ server/
│  ├─ controllers/
│  ├─ middleware/
│  ├─ models/
│  ├─ routes/
│  ├─ services/
│  ├─ app.js
│  ├─ server.js
│  └─ .env.example
└─ README.md
```

## Authentication Flow

1. `POST /api/register` creates an account and sends an OTP.
2. `POST /api/login` validates credentials and sends an OTP (or handles Google OAuth directly).
3. `POST /api/verify-otp` completes sign-in and returns the JWT token.
4. The frontend routes users contextually via `redirect` logic (e.g., back to the cart after authentication).
5. Protected routes and admin panels verify the JWT and corresponding `role`/`canAccessAdmin` permissions.

## Environment Setup

Copy the example environment file and fill in your real values:

```bash
cd server
cp .env.example .env
```

**Required backend variables:**
- `PORT` (Default: 8081)
- `MONGO_URI`
- `JWT_SECRET`
- `ADMIN_EMAIL` (Crucial for bootstrapping the initial admin owner account)
- `GOOGLE_CLIENT_ID`, `GOOGLE_API_CLIENT_ID`, `GOOGLE_API_CLIENT_SECRET`, `GOOGLE_API_REFRESH_TOKEN`
- `GMAIL_USER`, `GMAIL_APP_PASSWORD`
- `OPENAI_API_KEY` or `GEMINI_API_KEY`
- `ZALOPAY_APP_ID`, `ZALOPAY_KEY1`, `ZALOPAY_KEY2`, `ZALOPAY_ENDPOINT`, `ZALOPAY_CALLBACK_URL`

## Local Development

### Backend

```bash
cd server
npm install
npm start
```
The backend runs on `http://localhost:8081` by default.

### Frontend

```bash
cd client
npm install
npm run dev
```
The frontend runs on `http://localhost:5173` by default.

## API Architecture

- **/api/auth**: Login, registration, OTP, Google Auth, session retrieval.
- **/api/products**: Public product listing and filtering.
- **/api/admin**: Protected routes for orders, user management, product mutation, sales, and activity logs.
- **/api/pay**: ZaloPay handshake and callback webhooks.
- **/api/chat**: AI integration endpoints.

## License

This project is intended for learning, portfolio use, and demonstrating full-stack e-commerce architecture.
