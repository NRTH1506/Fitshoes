// server/server.js

// --- Import thư viện ---
const path = require('path');
const fs = require('fs');
const axios = require("axios");
const moment = require("moment");
const crypto = require("crypto");
const multer = require("multer");

// Load environment variables from .env if present
try { 
    require('dotenv').config({ path: path.join(__dirname, '.env') }); 
    console.log('✅ .env loaded successfully');
} catch (e) { 
    console.warn('⚠️ dotenv initialization failed:', e && e.message); 
}
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const PasswordHasher = require('./PasswordHasher'); 
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

// --- Google API Config for Emails ---
const GMAIL_CLIENT_ID = process.env.GOOGLE_API_CLIENT_ID || '';
const GMAIL_CLIENT_SECRET = process.env.GOOGLE_API_CLIENT_SECRET || '';
const GMAIL_REFRESH_TOKEN = process.env.GOOGLE_API_REFRESH_TOKEN || '';
const GMAIL_USER_EMAIL = process.env.GMAIL_USER || '';

console.log('[Gmail API Config] Status:', {
    clientId: !!GMAIL_CLIENT_ID,
    clientSecret: !!GMAIL_CLIENT_SECRET,
    refreshToken: !!GMAIL_REFRESH_TOKEN,
    userEmail: !!GMAIL_USER_EMAIL
});

// --- Import Logger Middleware ---
const logHttpRequest = require('./middleware/httpLogger');
const logError = require('./middleware/errorLogger');
const { logLoginAttempt, logOtpVerification } = require('./middleware/authLogger');
const { logProductAdd, logProductDelete, logProductUpdate } = require('./middleware/auditLogger');

// --- Multer Setup ---
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
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only images allowed'), false);
    }
});

// --- Khởi tạo ứng dụng ---
const app = express();
const hasher = new PasswordHasher(10); // Khởi tạo hasher
const PORT = process.env.PORT || 8081;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fitshoes';

// Cấu hình Google Client ID
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
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

// Theo dõi thông tin đăng nhập Google gần nhất (cho mục đích debug)
let lastGoogleLogin = null;

// --- Email: Gmail API Setup ---
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

        // Create the email in RFC 5322 format
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

        // Encode the message to base64url
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


// --- Cấu hình CORS (Đã được chỉ định) ---
const FE_ORIGINS = (process.env.FE_ORIGINS || 'http://localhost:5173,http://localhost:8081').split(',').map(s => s.trim());

const corsOptions = {
    origin: function(origin, callback){
        if(!origin) return callback(null, true);
        // Whitelist exact matches
        if(FE_ORIGINS.indexOf(origin) !== -1) return callback(null, true);
        // Allow Vercel preview deployments
        if(origin.endsWith('.vercel.app')) return callback(null, true);
        
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
    credentials: true
};

app.use(cors(corsOptions));

// --- Trust proxy (Render / Vercel reverse proxy) ---
app.set('trust proxy', 1);

// --- HTTPS redirect in production ---
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.headers['x-forwarded-proto'] !== 'https') {
            return res.redirect(301, `https://${req.hostname}${req.url}`);
        }
        next();
    });
}

// --- Security middleware ---
app.use(helmet({ contentSecurityPolicy: false }));

// --- Rate limiting on auth endpoints ---
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' } });

// --- Apply HTTP Logger Middleware (log all requests) ---
app.use(logHttpRequest);

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Mongoose Schema & Model ---
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: '' },
    gender: { type: String, enum: ['', 'male', 'female', 'other'], default: '' },
    address: { type: String, default: '' },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const Product = require('./models/Product');

// THÊM: OTP Schema (từ File 2)
const otpSchema = new mongoose.Schema({
    email: { type: String, required: true, index: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    createdAt: { type: Date, default: Date.now }
});
const Otp = mongoose.model('Otp', otpSchema);

//Order Schema
const orderSchema = new mongoose.Schema({
    userId: { type: String, default: "" },
    items: { type: Array, default: [] },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, default: "ZALOPAY" },   // ZALOPAY, COD, VNPAY
    paymentChannel: { type: Number, default: 38 }, // 36/37/38/39/41
    app_trans_id: { type: String, required: true },
    status: { 
        type: String,
        enum: ["PENDING", "SUCCESS", "FAILED"],
        default: "PENDING"
    },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model("Order", orderSchema);


// --- Kết nối MongoDB ---
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => {
        console.warn('⚠️ MongoDB connection error (continuing with static fallback):', err && err.message);
    });
// Track DB connection state
let dbConnected = false;
mongoose.connection.on('connected', () => { dbConnected = true; console.log('MongoDB connection readyState=1'); });
mongoose.connection.on('disconnected', () => { dbConnected = false; console.log('MongoDB disconnected'); });

// --- API: Health Check ---
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', db: dbConnected, timestamp: new Date().toISOString() });
});

// --- LOGGING FOR DEBUGGING ---
app.use((req, res, next) => {
    if (req.path.includes('/api/login')) {
        console.log(`[DEBUG] Incoming ${req.method} ${req.path} from ${req.ip}`);
        console.log(`[DEBUG] Body Keys:`, Object.keys(req.body || {}));
    }
    next();
});

// --- API: Đăng ký tài khoản ---
app.post('/api/register', authLimiter, async (req, res) => {
    try {
        if(!dbConnected) return res.status(503).json({ success:false, message: 'Database unavailable' });
        const { name, email, password, phone, gender, address } = req.body || {};
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
        }

        const lowerEmail = String(email).trim().toLowerCase();
        const existingEmail = await User.findOne({ email: lowerEmail });
        if (existingEmail) {
            return res.status(409).json({ success: false, message: 'Email đã tồn tại' });
        }

        const passwordHash = await hasher.hashPassword(password);
        const user = new User({
            name: String(name).trim(),
            email: lowerEmail,
            passwordHash,
            phone: String(phone || '').trim(),
            gender: String(gender || '').trim(),
            address: String(address || '').trim()
        });

        await user.save();

        // Generate OTP and send email
        const otpCode = String(Math.floor(100000 + Math.random() * 900000));
        const otpExpiry = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes
        
        try {
            await Otp.create({ email: lowerEmail, code: otpCode, expiresAt: otpExpiry });
        } catch (e) {
            console.error('Failed to create OTP record', e && e.message);
        }

        if (GMAIL_REFRESH_TOKEN) {
            sendEmailViaGmailAPI({
                to: lowerEmail,
                subject: '[FitShoes] Xác thực tài khoản',
                text: `Chào ${String(name).trim()},\n\nMã xác thực của bạn là: ${otpCode}\n\nMã sẽ hết hạn trong 10 phút.\n\nTrân trọng,\nFitShoes Team`
            });
            console.log(`Async Register OTP (Gmail API) initiated for ${lowerEmail}`);
        } else {
            console.warn('Gmail API credentials missing');
        }

        return res.status(201).json({ success: true, message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực.', email: lowerEmail });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// --- API: Đăng nhập (Yêu cầu OTP) ---
app.post('/api/login', authLimiter, async (req, res) => {
    try {
        if(!dbConnected) return res.status(503).json({ success:false, message: 'Database unavailable' });
        const { email, password } = req.body || {};
        
        const user = await User.findOne({ email: String(email).trim().toLowerCase() });
        if (!user) {
            logLoginAttempt(email, false, req.ip, 'password');
            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
        }

        const ok = await hasher.verifyPassword(password, user.passwordHash);
        if (!ok) {
            logLoginAttempt(email, false, req.ip, 'password');
            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
        }

        // Log successful login attempt
        logLoginAttempt(email, true, req.ip, 'password');

        // THÊM: Logic tạo và gửi OTP (từ File 2)
        try {
            const otpCode = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
            const otpExpiry = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes
            await Otp.create({ email: user.email, code: otpCode, expiresAt: otpExpiry });

            if (GMAIL_REFRESH_TOKEN) {
                // Send email asynchronously
                sendEmailViaGmailAPI({
                    to: user.email,
                    subject: 'FitShoes - Your verification code',
                    text: `Your verification code is ${otpCode}. It will expire in 10 minutes.`
                });
                console.log(`Async limited OTP (Gmail API) initiated for ${user.email}`);
            } else {
                console.warn('Gmail API credentials missing');
            }
        } catch (e) {
            console.error('Failed to create OTP record', e && e.message);
        }

        // Thông báo cho client cần xác thực OTP
        return res.json({ success: true, needOtp: true, email: user.email });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// --- API: Đăng nhập bằng Google (ID token) (Từ File 2) ---
app.post('/api/login-google', async (req, res) => {
    try {
        const { credential } = req.body || {};
        if (!credential) return res.status(400).json({ success: false, message: 'Missing credential' });

        if (!googleClient) return res.status(500).json({ success: false, message: 'Google client not configured on server' });

        // Verify ID token with Google
        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
            payload = ticket.getPayload();
        } catch (e) {
            console.error('Google token verification failed', e && e.message);
            logLoginAttempt('unknown', false, req.ip, 'google');
            return res.status(401).json({ success: false, message: 'Invalid Google credential' });
        }

        const email = String(payload.email || '').trim().toLowerCase();
        const name = payload.name || payload.email || 'Google User';

        if (!email) return res.status(400).json({ success: false, message: 'Google token missing email' });

        // Find existing user or create new one
        let user = await User.findOne({ email });
        if (!user) {
            const randomPassword = Math.random().toString(36).slice(2);
            const passwordHash = await hasher.hashPassword(randomPassword);
            user = new User({ name: String(name).trim(), email, passwordHash });
            await user.save();
        }

        // record last login for debug
        lastGoogleLogin = { email: user.email, name: user.name, userId: String(user._id), at: new Date().toISOString() };
        console.log('Google login:', lastGoogleLogin);
        logLoginAttempt(user.email, true, req.ip, 'google');

        // Return user data directly, skipping OTP
        return res.json({ 
            success: true, 
            user: { 
                _id: user._id, 
                name: user.name, 
                email: user.email, 
                phone: user.phone || '',
                gender: user.gender || '',
                address: user.address || ''
            } 
        });
    } catch (err) {
        console.error('Error in /api/login-google', err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// --- API: Xác thực OTP (Từ File 2) ---
app.post('/api/verify-otp', authLimiter, async (req, res) => {
    try {
        const { email, code } = req.body || {};
        if (!email || !code) return res.status(400).json({ success: false, message: 'Missing email or code' });

        const record = await Otp.findOne({ email: String(email).trim().toLowerCase(), code: String(code).trim() });
        if (!record) return res.status(400).json({ success: false, message: 'Invalid code' });
        if (record.expiresAt < new Date()) {
            await Otp.deleteOne({ _id: record._id });
            return res.status(400).json({ success: false, message: 'Code expired' });
        }

        // OTP valid -> delete it and return user info
        await Otp.deleteOne({ _id: record._id });
        const user = await User.findOne({ email: String(email).trim().toLowerCase() });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Log successful OTP verification
        logOtpVerification(email, true);
        return res.json({ 
            success: true, 
            user: { 
                _id: user._id, 
                name: user.name, 
                email: user.email, 
                phone: user.phone || '',
                gender: user.gender || '',
                address: user.address || ''
            } 
        });
    } catch (err) {
        console.error('Error in /api/verify-otp', err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// --- API: Gửi lại OTP ---
app.post('/api/resend-otp', async (req, res) => {
    try {
        const { email } = req.body || {};
        if (!email) return res.status(400).json({ success: false, message: 'Missing email' });

        const cleanEmail = String(email).trim().toLowerCase();
        
        // Check if user exists
        const user = await User.findOne({ email: cleanEmail });
        if (!user) return res.status(400).json({ success: false, message: 'Người dùng không tồn tại' });

        // Delete old OTP codes for this email
        await Otp.deleteMany({ email: cleanEmail });

        // Generate new OTP
        const otpCode = String(Math.floor(100000 + Math.random() * 900000));
        const otpExpiry = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes
        
        try {
            await Otp.create({ email: cleanEmail, code: otpCode, expiresAt: otpExpiry });
        } catch (e) {
            console.error('Failed to create new OTP record', e && e.message);
            return res.status(500).json({ success: false, message: 'Không thể tạo mã xác thực' });
        }

        // Send email with new OTP
        if (GMAIL_REFRESH_TOKEN) {
            sendEmailViaGmailAPI({
                to: cleanEmail,
                subject: 'FitShoes - Mã xác thực mới',
                text: `Mã xác thực mới của bạn là: ${otpCode}\n\nMã sẽ hết hạn trong 10 phút.\n\nVui lòng không chia sẻ mã này với ai khác.`
            });
            console.log(`Async resend OTP (Gmail API) initiated for ${cleanEmail}`);
        } else {
            console.warn('Gmail API credentials missing');
            return res.status(500).json({ success: false, message: 'Hệ thống email không khả dụng' });
        }

        return res.json({ success: true, message: 'Mã xác thực mới đã được gửi' });
    } catch (err) {
        console.error('Error in /api/resend-otp', err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});


// --- API: Lấy thông tin user theo id ---
app.get('/api/users/:id', async (req, res) => {
    try {
        if(!dbConnected) return res.status(503).json({ success:false, message: 'Database unavailable' });
        // Tìm user theo ObjectId
        try {
            const user = await User.findById(req.params.id).select('name email');
            if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
            return res.json({ success: true, data: { id: user._id, name: user.name, email: user.email } });
        } catch (e) {
            return res.status(400).json({ success: false, message: 'Id không hợp lệ' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// --- API: Thêm sản phẩm ---
app.post('/api/products/add', async (req, res) => {
    try {
        if(!dbConnected) return res.status(503).json({ success:false, message: 'Database unavailable' });
        // Sử dụng các trường chi tiết từ File 2
        const { title, title_vi, price, oldPrice, currency, brand, description_vi, images, gender } = req.body || {};
        
        // Yêu cầu title_vi và price
        if (!title_vi || !price) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin sản phẩm' });
        }

        const product = new Product({
            title: title ? String(title).trim() : String(title_vi).trim(),
            title_vi: String(title_vi).trim(),
            price: Number(price),
            oldPrice: oldPrice ? Number(oldPrice) : undefined,
            currency: String(currency || 'VND'),
            brand: String(brand || '').trim(),
            description_vi: String(description_vi || ''),
            images: Array.isArray(images) ? images.map(String) : (images ? [String(images)] : []),
            gender: ['male','female','unisex'].includes(gender) ? gender : 'unisex'
        });

        await product.save();
        // Log admin action
        logProductAdd(req.user?.id || 'unknown', req.user?.email || 'unknown', String(product._id), {
            title_vi: product.title_vi,
            price: product.price,
            currency: product.currency
        });
        return res.status(201).json({ success: true, message: 'Thêm sản phẩm thành công', product });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// --- Helper: load static products fallback ---
function loadStaticProducts(){
    try{
        const raw = fs.readFileSync(path.join(__dirname, 'static-products.json'), 'utf8');
        return JSON.parse(raw);
    }catch(e){
        console.warn('Không thể load static-products.json', e && e.message);
        return [];
    }
}

// --- API: Danh sách sản phẩm (Lấy logic đơn giản của File 2) ---
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        if (products && products.length) return res.json({ success: true, data: products });
        
        // fallback to static list when DB empty
        const staticProducts = loadStaticProducts();
        return res.json({ success: true, data: staticProducts });
    } catch (err) {
        console.error(err);
        const staticProducts = loadStaticProducts();
        return res.json({ success: true, data: staticProducts });
    }
});

// --- API: Chi tiết sản phẩm ---
app.get('/api/products/:id', async (req, res) => {
    try {
        // Thử tìm trong DB theo ObjectId
        try{
            const product = await Product.findById(req.params.id);
            if (product) return res.json({ success: true, data: product });
        }catch(e){ /* ignore invalid ObjectId errors */ }

        // fallback: nếu id là số nguyên, tìm trong static-products.json theo trường id
        const idInt = parseInt(req.params.id, 10);
        if (!isNaN(idInt)){
            const staticProducts = loadStaticProducts();
            const p = staticProducts.find(x => Number(x.id) === idInt);
            if (p) return res.json({ success: true, data: p });
        }

        return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// --- API: Sửa sản phẩm (Từ File 2) ---
app.put('/api/products/:id', async (req, res) => {
    try {
        if(!dbConnected) return res.status(503).json({ success:false, message: 'Database unavailable' });
        
        const { title, title_vi, price, oldPrice, currency, description_vi, images, gender } = req.body || {};
        
        if (!title || !title_vi || !price) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin sản phẩm' });
        }
        
        try {
            const product = await Product.findByIdAndUpdate(
                req.params.id,
                {
                    title: String(title).trim(),
                    title_vi: String(title_vi).trim(),
                    price: Number(price),
                    oldPrice: oldPrice ? Number(oldPrice) : undefined,
                    currency: String(currency || 'VND'),
                    description_vi: String(description_vi || ''),
                    images: Array.isArray(images) ? images.map(String) : (images ? [String(images)] : []),
                    gender: ['male','female','unisex'].includes(gender) ? gender : 'unisex'
                },
                { new: true, runValidators: true }
            );
            
            if (product) {
                logProductUpdate(req.user?.id || 'unknown', req.user?.email || 'unknown', req.params.id, product);
                return res.json({ success: true, message: 'Cập nhật sản phẩm thành công', product });
            }
        } catch(e) { /* continue to error handling */ }
        
        return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// --- API: Xóa sản phẩm ---
app.delete('/api/products/:id', async (req, res) => {
    try {
        if(!dbConnected) return res.status(503).json({ success:false, message: 'Database unavailable' });
        
        // Try to delete by ObjectId
        try {
            const product = await Product.findByIdAndDelete(req.params.id);
            if (product) {
                logProductDelete(req.user?.id || 'unknown', req.user?.email || 'unknown', req.params.id, product.title_vi || product.title);
                return res.json({ success: true, message: 'Xóa sản phẩm thành công', product });
            }
        } catch(e) { /* continue to error handling */ }
        
        return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Debug endpoint to inspect last Google login (development only)
app.get('/api/debug/last-google-login', (req, res) => {
    if (!lastGoogleLogin) return res.status(404).json({ success: false, message: 'No Google login recorded yet' });
    return res.json({ success: true, data: lastGoogleLogin });
});

// --- API: Get logs ---
app.get('/api/logs', (req, res) => {
    const logType = req.query.type;
    if (!logType) return res.status(400).json({ success: false, message: 'Log type required' });

    const logPath = path.join(__dirname, 'logs', logType);
    if (!fs.existsSync(logPath)) {
        return res.status(404).json({ success: false, message: 'Log file not found' });
    }

    try {
        const content = fs.readFileSync(logPath, 'utf-8');
        const logs = content.split('\n')
            .filter(line => line.trim())
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch (e) {
                    return null;
                }
            })
            .filter(Boolean)
            .reverse(); // newest first

        res.json({ success: true, logs });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error reading logs' });
    }
});

// --- API: Update user profile ---
app.put('/api/profile', async (req, res) => {
    try {
        if(!dbConnected) return res.status(503).json({ success:false, message: 'Database unavailable' });
        
        const { userId, phone, gender, address, bio, name } = req.body || {};
        if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Update fields
        if (name !== undefined) user.name = String(name).trim();
        if (phone !== undefined) user.phone = String(phone || '').trim();
        if (gender !== undefined) user.gender = String(gender || '').trim();
        if (address !== undefined) user.address = String(address || '').trim();
        if (bio !== undefined) user.bio = String(bio || '').trim();

        await user.save();

        return res.json({ 
            success: true, 
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                gender: user.gender,
                address: user.address,
                bio: user.bio,
                avatar: user.avatar
            }
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// --- API: Upload avatar with Error Handling ---
app.post('/api/profile/upload', (req, res) => {
    upload.single('avatar')(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            console.error('[Upload] Multer Error:', err.code, err.field);
            return res.status(400).json({ success: false, message: `Lỗi upload: ${err.message} (Field: ${err.field})` });
        } else if (err) {
            console.error('[Upload] Custom Error:', err.message);
            return res.status(400).json({ success: false, message: err.message });
        }

        try {
            const { userId } = req.body;
            console.log(`[Upload] Attempting avatar upload for user: ${userId}`);
            
            if (!userId) {
                console.warn('[Upload] User ID missing in request body');
                return res.status(400).json({ success: false, message: 'User ID required' });
            }
            
            if (!req.file) {
                console.warn('[Upload] No file found in req.file. Body keys:', Object.keys(req.body));
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            console.log(`[Upload] File received: ${req.file.filename}, size: ${req.file.size}`);

            const user = await User.findById(userId);
            if (!user) {
                console.error(`[Upload] User not found in DB: ${userId}`);
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const avatarUrl = `/uploads/${req.file.filename}`;
            user.avatar = avatarUrl;
            await user.save();

            console.log(`[Upload] Success! Avatar URL: ${avatarUrl}`);
            res.json({ success: true, avatarUrl, user: { ...user.toObject(), _id: user._id } });
        } catch (err) {
            console.error('[Upload] Server Error:', err);
            res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
        }
    });
});



// ============================ ORDER & HISTORY ============================
app.get("/api/ping", (req, res) => res.json({ success: true, message: "pong", timestamp: new Date() }));

app.get("/api/pay/zalopay/query/:app_trans_id", async (req, res) => {
    try {
        const { app_trans_id } = req.params;
        const postData = { app_id: ZALOPAY.app_id, app_trans_id };
        const dataToSign = `${postData.app_id}|${postData.app_trans_id}|${ZALOPAY.key1}`;
        postData.mac = crypto.createHmac("sha256", ZALOPAY.key1).update(dataToSign).digest("hex");
        const queryEndpoint = ZALOPAY.endpoint.replace("/create", "/query");
        const queryRes = await axios.post(queryEndpoint, new URLSearchParams(postData).toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        let status = "PENDING";
        if (queryRes.data.return_code === 1) status = "SUCCESS";
        else if (queryRes.data.return_code === 2) status = "FAILED";
        if (status !== "PENDING") await Order.findOneAndUpdate({ app_trans_id }, { status });
        return res.json({ success: true, status, detail: queryRes.data });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Lỗi truy vấn đơn hàng" });
    }
});

app.get("/api/orders/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const orders = await Order.find({ userId }).sort({ createdAt: -1 });
        return res.json({ success: true, orders });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Lỗi lấy lịch sử đơn hàng" });
    }
});

// ============================ ZALOPAY CONFIG ============================
const ZALOPAY = {
    app_id: parseInt(process.env.ZALOPAY_APP_ID) || 554,
    key1: process.env.ZALOPAY_KEY1 || "8NdU5pG5R2spGHGhyO99HN1OhD8IQJBn",
    key2: process.env.ZALOPAY_KEY2 || "uUfsWgfLkRLzq6W2uNXTCxrfxs51auny",
    endpoint: process.env.ZALOPAY_ENDPOINT || "https://sb-openapi.zalopay.vn/v2/create"
};

// ============================ 1. API TẠO ĐƠN HÀNG ============================
app.post("/api/pay/zalopay", async (req, res) => {
    try {
        const { amount, items, userId } = req.body;

        if (!amount || !items) {
            return res.json({ success: false, message: "Thiếu dữ liệu đơn hàng" });
        }

        const app_trans_id = `${moment().format("YYMMDD")}_${Date.now()}`;

        // Link redirect sau khi thanh toán xong trên giao diện ZaloPay
        const origin = req.headers.origin || process.env.FE_URL || "http://localhost:5173";
        const embed_data = {
            redirecturl: `${origin}/payment-success`
        };

        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.get('host');
        const callback_url = process.env.ZALOPAY_CALLBACK_URL || `${protocol}://${host}/api/zalopay/callback`;

        const orderData = {
            app_id: ZALOPAY.app_id,
            app_user: userId || "guest",
            app_trans_id,
            app_time: Date.now(),
            item: JSON.stringify(items),
            amount: amount,
            description: `Thanh toán đơn hàng #${app_trans_id}`,
            
            // --- CẤU HÌNH SANDBOX ---
            // Bắt buộc dùng "zalopayapp" với App ID 554 để tránh lỗi hệ thống
            bank_code: "zalopayapp", 
            
            embed_data: JSON.stringify(embed_data),
            
            // QUAN TRỌNG: Link này phải public ra internet (dùng Ngrok)
            // Nếu để localhost, ZaloPay sẽ KHÔNG gọi được.
            callback_url: callback_url
        };

        // Tạo chữ ký MAC (Dùng KEY 1)
        const dataToSign = [
            orderData.app_id,
            orderData.app_trans_id,
            orderData.app_user,
            orderData.amount,
            orderData.app_time,
            orderData.embed_data,
            orderData.item
        ].join("|");

        orderData.mac = crypto.createHmac("sha256", ZALOPAY.key1).update(dataToSign).digest("hex");

        console.log(`[ZaloPay] Tạo đơn hàng ${app_trans_id}...`);

        // Gọi API ZaloPay
        const formBody = new URLSearchParams(orderData).toString();
        const zalores = await axios.post(ZALOPAY.endpoint, formBody, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        console.log("[ZaloPay] Response:", zalores.data);

        // Kiểm tra kết quả
        const returnCode = zalores.data.return_code !== undefined ? zalores.data.return_code : zalores.data.returncode;
        if (returnCode !== 1) {
            return res.json({
                success: false,
                message: "ZaloPay từ chối: " + (zalores.data.return_message || "Lỗi"),
                detail: zalores.data
            });
        }

        // Lưu đơn hàng PENDING
        await Order.create({
            userId,
            items,
            amount,
            paymentMethod: "ZALOPAY",
            app_trans_id,
            status: "PENDING"
        });

        return res.json({
            success: true,
            payUrl: zalores.data.order_url,
            app_trans_id
        });

    } catch (err) {
        console.error("[ZaloPay] Lỗi tạo đơn:", err.message);
        return res.json({ success: false, message: "Lỗi kết nối cổng thanh toán." });
    }
});

// ============================ 2. API CALLBACK ============================
app.post("/api/zalopay/callback", async (req, res) => {
    let result = {};

    try {
        const { data: dataStr, mac: reqMac } = req.body;
        const mac = crypto.createHmac("sha256", ZALOPAY.key2).update(dataStr).digest("hex");

        if (reqMac !== mac) {
            result.return_code = -1;
            result.return_message = "mac not equal";
        } else {
            const dataJson = JSON.parse(dataStr);
            const { app_trans_id, amount } = dataJson;

            console.log(`[ZaloPay Callback] Nhận tín hiệu từ ZaloPay: ${app_trans_id}`);

            // 1. Cập nhật DB
            const order = await Order.findOneAndUpdate(
                { app_trans_id: app_trans_id },
                { status: "SUCCESS" },
                { new: true }
            );

            if (order) {
                console.log(`[DB] Đã update đơn hàng ${app_trans_id} thành SUCCESS`);

                // 2. GỬI MAIL (Logic kiểm tra user)
                if (mailTransporter) {
                    let userEmail = "email_admin@example.com"; 

                    if (order.userId && mongoose.Types.ObjectId.isValid(order.userId)) {
                        const user = await User.findById(order.userId);
                        if (user) userEmail = user.email;
                    } 

                    const mailOptions = {
                        from: GMAIL_USER,
                        to: userEmail,
                        subject: `[FitShoes] Thanh toán thành công #${app_trans_id}`,
                        html: `
                            <h2>Cảm ơn bạn đã mua hàng!</h2>
                            <p>Mã đơn: <b>${app_trans_id}</b></p>
                            <p>Số tiền: <b>${new Intl.NumberFormat('vi-VN').format(amount)} đ</b></p>
                            <p>Trạng thái: <span style="color:green">THÀNH CÔNG</span></p>
                        `
                    };

                    mailTransporter.sendMail(mailOptions, (err, info) => {
                        if (err) console.error("[Mail Error]", err);
                        else console.log("[Mail Sent]", info.response);
                    });
                }

                result.return_code = 1;
                result.return_message = "success";
            } else {
                result.return_code = 0;
                result.return_message = "order not found";
            }
        }
    } catch (ex) {
        console.error("[Callback Error]", ex.message);
        result.return_code = 0;
        result.return_message = ex.message;
    }

    res.json(result);
});

// --- Final Middlewares (must be last) ---

// Import và sử dụng Chatbot Routes
const chatbotRoutes = require('./routes/chatbot');
app.use('/api', chatbotRoutes);

// Apply Error Logger Middleware
app.use(logError);

// API 404 handler — pure API server, no static files
app.use((req, res) => {
    console.warn(`[404] Unmatched ${req.method} ${req.originalUrl}`);
    res.status(404).json({ success: false, message: 'API Endpoint Not Found [v2]' });
});

// --- Khởi động server ---
app.listen(PORT, () => console.log(`🚀 API Server running at http://localhost:${PORT}`));