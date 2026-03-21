const path = require('path');

try {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
    console.log('✅ .env loaded successfully');
} catch (e) {
    console.warn('⚠️ dotenv initialization failed:', e && e.message);
}

const mongoose = require('mongoose');
const { app, PORT, MONGO_URI, setDbConnected } = require('./app');
const PasswordHasher = require('./PasswordHasher');
const { ensureAdminUser } = require('./services/bootstrapAdmin');

const hasher = new PasswordHasher(10);

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => {
        console.warn('⚠️ MongoDB connection error (continuing with static fallback):', err && err.message);
    });

mongoose.connection.on('connected', () => {
    setDbConnected(true);
    console.log('MongoDB connection readyState=1');
    ensureAdminUser(hasher).catch((err) => {
        console.warn('[bootstrapAdmin] Failed:', err && err.message);
    });
});

mongoose.connection.on('disconnected', () => {
    setDbConnected(false);
    console.log('MongoDB disconnected');
});

app.listen(PORT, () => console.log(`🚀 API Server running at http://localhost:${PORT}`));
