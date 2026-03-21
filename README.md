# FitShoes

FitShoes is a full-stack shoe store application with a React frontend and an Express/MongoDB backend. It includes OTP-based authentication, Google sign-in, JWT-protected admin access, product management, profile updates, ZaloPay payment flow, request logging, and an AI chatbot.

## Stack

- Frontend: React, Vite, React Router
- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Auth: JWT, OTP email verification, Google sign-in
- Payments: ZaloPay sandbox
- AI: OpenAI / Gemini-backed chatbot

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
│  ├─ utils/
│  ├─ app.js
│  ├─ server.js
│  └─ .env.example
└─ README.md
```

## Main Features

- Browse products and view product details
- Register and log in with email + OTP verification
- Sign in with Google
- JWT-based protected routes
- Admin and authorized-user access control for admin pages and logs
- Profile update and avatar upload
- Order history and ZaloPay payment integration
- Request, auth, audit, and error logging
- AI chatbot for store assistance

## Authentication Flow

1. `POST /api/register` creates an account and sends an OTP.
2. `POST /api/login` validates credentials and sends an OTP.
3. `POST /api/verify-otp` completes sign-in and returns:

```json
{
  "success": true,
  "token": "jwt-token",
  "user": {}
}
```

4. `POST /api/login-google` also returns:

```json
{
  "success": true,
  "token": "jwt-token",
  "user": {}
}
```

5. The frontend uses the JWT for protected requests and `GET /api/me` to load the current user.

## Key API Endpoints

### Auth

- `POST /api/register`
- `POST /api/login`
- `POST /api/verify-otp`
- `POST /api/resend-otp`
- `POST /api/login-google`
- `GET /api/me`

### Products

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products/add`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

### User

- `PUT /api/profile`
- `POST /api/profile/upload`
- `GET /api/users/:id`

### Orders and Payments

- `GET /api/orders/user/:userId`
- `POST /api/pay/zalopay`
- `GET /api/pay/zalopay/query/:app_trans_id`
- `POST /api/zalopay/callback`

### Admin and Logs

- `GET /api/logs`

### System and Chatbot

- `GET /api/health`
- `GET /api/ping`
- `POST /api/chat`
- `POST /api/chat/clear`

## Environment Setup

Copy the example environment file and fill in your real values:

```bash
cd server
cp .env.example .env
```

Important backend variables include:

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_API_CLIENT_ID`
- `GOOGLE_API_CLIENT_SECRET`
- `GOOGLE_API_REFRESH_TOKEN`
- `GMAIL_USER`
- `FE_ORIGINS`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `ZALOPAY_APP_ID`
- `ZALOPAY_KEY1`
- `ZALOPAY_KEY2`
- `ZALOPAY_ENDPOINT`
- `ZALOPAY_CALLBACK_URL`

## Local Development

### Backend

```bash
cd server
npm install
npm start
```

Backend runs on `http://localhost:8081` by default.

### Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## Admin Access

Admin-only operations use JWT authentication and require one of these:

- `user.role === "admin"`
- `user.canAccessAdmin === true`

This applies to product management and log access.

## Notes

- Product reads can fall back to `server/static-products.json` if MongoDB is unavailable.
- Uploaded avatars are stored under `server/uploads/`.
- Health check is available at `GET /api/health`.
- The backend entry point is `server/server.js`, while Express app configuration lives in `server/app.js`.

## License

This project is intended for learning and portfolio use.
