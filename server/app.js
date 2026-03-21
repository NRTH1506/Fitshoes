const path = require('path');
const fs = require('fs');
const axios = require("axios");
const moment = require("moment");
const crypto = require("crypto");
const multer = require("multer");
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const PasswordHasher = require('./PasswordHasher');
const { OAuth2Client } = require('google-auth-library');
const User = require('./models/User');
const Otp = require('./models/Otp');
const Order = require('./models/Order');
const Product = require('./models/Product');
const { buildProductPayload, loadStaticProducts } = require('./utils/productUtils');
const {
    authenticateJWT,
    requireAdminAccess,
    createAccessToken,
    sanitizeUser,
    normalizeEmail,
    isValidObjectId
} = require('./middleware/auth');
const createAuthRoutes = require('./routes/auth.routes');
const createProductRoutes = require('./routes/product.routes');
const createUserRoutes = require('./routes/user.routes');
const createOrderRoutes = require('./routes/order.routes');
const createAdminRoutes = require('./routes/admin.routes');
const chatbotRoutes = require('./routes/chatbot');
const logHttpRequest = require('./middleware/httpLogger');
const logError = require('./middleware/errorLogger');
const { logLoginAttempt, logOtpVerification } = require('./middleware/authLogger');
const { logProductAdd, logProductDelete, logProductUpdate } = require('./middleware/auditLogger');

const GMAIL_CLIENT_ID = process.env.GOOGLE_API_CLIENT_ID || '';
const GMAIL_CLIENT_SECRET = process.env.GOOGLE_API_CLIENT_SECRET || '';
const GMAIL_REFRESH_TOKEN = process.env.GOOGLE_API_REFRESH_TOKEN || '';
const GMAIL_USER_EMAIL = process.env.GMAIL_USER || '';
const GMAIL_USER = GMAIL_USER_EMAIL;
const mailTransporter = null;

console.log('[Gmail API Config] Status:', {
    clientId: !!GMAIL_CLIENT_ID,
    clientSecret: !!GMAIL_CLIENT_SECRET,
    refreshToken: !!GMAIL_REFRESH_TOKEN,
    userEmail: !!GMAIL_USER_EMAIL
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only images allowed'), false);
    }
});

const app = express();
const hasher = new PasswordHasher(10);
const PORT = process.env.PORT || 8081;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fitshoes';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_API_CLIENT_ID || '';
let googleClient = null;
if (GOOGLE_CLIENT_ID) {
    try {
        googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
        console.log('Google client configured.');
    } catch (e) {
        console.warn('Failed to create Google OAuth2Client:', e && e.message);
        googleClient = null;
    }
} else {
    console.warn('Google client not configured on server (GOOGLE_CLIENT_ID missing)');
}

let lastGoogleLogin = null;
let dbConnected = false;

async function sendEmailViaGmailAPI({ to, subject, text }) {
    const missing = [];
    if (!GMAIL_CLIENT_ID) missing.push('GOOGLE_API_CLIENT_ID');
    if (!GMAIL_CLIENT_SECRET) missing.push('GOOGLE_API_CLIENT_SECRET');
    if (!GMAIL_REFRESH_TOKEN) missing.push('GOOGLE_API_REFRESH_TOKEN');
    if (!GMAIL_USER_EMAIL) missing.push('GMAIL_USER');

    if (missing.length > 0) {
        console.warn(`⚠️ [Gmail API] Credentials missing in Render: ${missing.join(', ')}`);
        return;
    }

    try {
        const oauth2Client = new OAuth2Client(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, 'https://developers.google.com/oauthplayground');
        oauth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });

        const accessTokenRes = await oauth2Client.getAccessToken();
        const accessToken = accessTokenRes.token;

        if (!accessToken) {
            throw new Error('Failed to generate Gmail API Access Token');
        }

        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const messageParts = [
            `From: FitShoes <${GMAIL_USER_EMAIL}>`,
            `To: ${to}`,
            `Content-Type: text/plain; charset=utf-8`,
            `MIME-Version: 1.0`,
            `Subject: ${utf8Subject}`,
            '',
            text,
        ];
        const message = messageParts.join('\r\n');

        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const response = await axios.post(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
            { raw: encodedMessage },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`[Gmail API] Email Success: to=${to}, id=${response.data.id}`);
        return response.data;
    } catch (err) {
        console.error(`[Gmail API] Error to=${to}:`, err.response?.data || err.message);
    }
}

const FE_ORIGINS = (process.env.FE_ORIGINS || 'http://localhost:5173,http://localhost:8081').split(',').map(s => s.trim());

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (FE_ORIGINS.indexOf(origin) !== -1) return callback(null, true);
        if (origin.endsWith('.vercel.app')) return callback(null, true);

        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.disable('x-powered-by');
app.set('trust proxy', 1);

if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.headers['x-forwarded-proto'] !== 'https') {
            return res.redirect(301, `https://${req.hostname}${req.url}`);
        }
        next();
    });
}

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' } });

app.use(logHttpRequest);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
}));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', db: dbConnected, timestamp: new Date().toISOString() });
});

app.use((req, res, next) => {
    if (req.path.includes('/api/login')) {
        console.log(`[DEBUG] Incoming ${req.method} ${req.path} from ${req.ip}`);
        console.log(`[DEBUG] Body Keys:`, Object.keys(req.body || {}));
    }
    next();
});

const ZALOPAY = {
    app_id: parseInt(process.env.ZALOPAY_APP_ID) || 554,
    key1: process.env.ZALOPAY_KEY1 || "8NdU5pG5R2spGHGhyO99HN1OhD8IQJBn",
    key2: process.env.ZALOPAY_KEY2 || "uUfsWgfLkRLzq6W2uNXTCxrfxs51auny",
    endpoint: process.env.ZALOPAY_ENDPOINT || "https://sb-openapi.zalopay.vn/v2/create"
};

const authRoutes = createAuthRoutes({
    User,
    Otp,
    authLimiter,
    hasher,
    dbConnectedRef: () => dbConnected,
    normalizeEmail,
    isValidObjectId,
    logLoginAttempt,
    logOtpVerification,
    sendEmailViaGmailAPI,
    GMAIL_REFRESH_TOKEN,
    googleClient,
    GOOGLE_CLIENT_ID,
    createAccessToken,
    sanitizeUser,
    authenticateJWT,
    getLastGoogleLogin: () => lastGoogleLogin,
    setLastGoogleLogin: (value) => { lastGoogleLogin = value; }
});

const productRoutes = createProductRoutes({
    Product,
    authenticateJWT,
    requireAdminAccess,
    buildProductPayload,
    loadStaticProducts,
    isValidObjectId,
    logProductAdd,
    logProductUpdate,
    logProductDelete,
    dbConnectedRef: () => dbConnected,
    baseDir: __dirname
});

const userRoutes = createUserRoutes({
    User,
    authenticateJWT,
    sanitizeUser,
    isValidObjectId,
    upload,
    multer,
    dbConnectedRef: () => dbConnected
});

const orderRoutes = createOrderRoutes({
    Order,
    User,
    authenticateJWT,
    axios,
    crypto,
    moment,
    mongoose,
    ZALOPAY,
    GMAIL_REFRESH_TOKEN,
    GMAIL_USER,
    mailTransporter,
    sendEmailViaGmailAPI
});

const adminRoutes = createAdminRoutes({
    fs,
    path,
    baseDir: __dirname,
    authenticateJWT,
    requireAdminAccess
});

app.use('/api', authRoutes);
app.use('/api', productRoutes);
app.use('/api', userRoutes);
app.use('/api', orderRoutes);
app.use('/api', adminRoutes);

app.get('/api/debug/last-google-login', (req, res) => {
    if (process.env.NODE_ENV === 'production') return res.status(404).json({ success: false, message: 'Not found' });
    if (!lastGoogleLogin) return res.status(404).json({ success: false, message: 'No Google login recorded yet' });
    return res.json({ success: true, data: lastGoogleLogin });
});

app.use('/api', chatbotRoutes);
app.use(logError);

app.use((req, res) => {
    console.warn(`[404] Unmatched ${req.method} ${req.originalUrl}`);
    res.status(404).json({ success: false, message: 'API Endpoint Not Found [v2]' });
});

module.exports = {
    app,
    PORT,
    MONGO_URI,
    setDbConnected: (value) => { dbConnected = value; },
    getDbConnected: () => dbConnected
};
