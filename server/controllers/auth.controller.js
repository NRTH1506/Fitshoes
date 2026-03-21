module.exports = ({
    User,
    Otp,
    hasher,
    dbConnectedRef,
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
    getLastGoogleLogin,
    setLastGoogleLogin
}) => ({
    register: async (req, res) => {
        try {
            if (!dbConnectedRef()) return res.status(503).json({ success: false, message: 'Database unavailable' });
            const { name, email, password, phone, gender, address } = req.body || {};
            if (!name || !email || !password) {
                return res.status(400).json({ success: false, message: 'ThiÃ¡ÂºÂ¿u thÃƒÂ´ng tin' });
            }

            const lowerEmail = normalizeEmail(email);
            const existingEmail = await User.findOne({ email: lowerEmail });
            if (existingEmail) {
                return res.status(409).json({ success: false, message: 'Email Ã„â€˜ÃƒÂ£ tÃ¡Â»â€œn tÃ¡ÂºÂ¡i' });
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

            const otpCode = String(Math.floor(100000 + Math.random() * 900000));
            const otpExpiry = new Date(Date.now() + 1000 * 60 * 10);

            try {
                await Otp.create({ email: lowerEmail, code: otpCode, expiresAt: otpExpiry });
            } catch (e) {
                console.error('Failed to create OTP record', e && e.message);
            }

            if (GMAIL_REFRESH_TOKEN) {
                sendEmailViaGmailAPI({
                    to: lowerEmail,
                    subject: '[FitShoes] XÃƒÂ¡c thÃ¡Â»Â±c tÃƒÂ i khoÃ¡ÂºÂ£n',
                    text: `ChÃƒÂ o ${String(name).trim()},\n\nMÃƒÂ£ xÃƒÂ¡c thÃ¡Â»Â±c cÃ¡Â»Â§a bÃ¡ÂºÂ¡n lÃƒÂ : ${otpCode}\n\nMÃƒÂ£ sÃ¡ÂºÂ½ hÃ¡ÂºÂ¿t hÃ¡ÂºÂ¡n trong 10 phÃƒÂºt.\n\nTrÃƒÂ¢n trÃ¡Â»Âng,\nFitShoes Team`
                });
                console.log(`Async Register OTP (Gmail API) initiated for ${lowerEmail}`);
            } else {
                console.warn('Gmail API credentials missing');
            }

            return res.status(201).json({ success: true, message: 'Ã„ÂÃ„Æ’ng kÃƒÂ½ thÃƒÂ nh cÃƒÂ´ng. Vui lÃƒÂ²ng kiÃ¡Â»Æ’m tra email Ã„â€˜Ã¡Â»Æ’ xÃƒÂ¡c thÃ¡Â»Â±c.', email: lowerEmail });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'LÃ¡Â»â€”i server' });
        }
    },

    login: async (req, res) => {
        try {
            if (!dbConnectedRef()) return res.status(503).json({ success: false, message: 'Database unavailable' });
            const { email, password } = req.body || {};
            const normalizedEmail = normalizeEmail(email);
            if (!normalizedEmail || !password) {
                return res.status(400).json({ success: false, message: 'ThiÃƒÂ¡Ã‚ÂºÃ‚Â¿u thÃƒÆ’Ã‚Â´ng tin' });
            }

            const user = await User.findOne({ email: normalizedEmail });
            if (!user) {
                logLoginAttempt(normalizedEmail, false, req.ip, 'password');
                return res.status(401).json({ success: false, message: 'Email hoÃ¡ÂºÂ·c mÃ¡ÂºÂ­t khÃ¡ÂºÂ©u khÃƒÂ´ng Ã„â€˜ÃƒÂºng' });
            }

            const ok = await hasher.verifyPassword(password, user.passwordHash);
            if (!ok) {
                logLoginAttempt(normalizedEmail, false, req.ip, 'password');
                return res.status(401).json({ success: false, message: 'Email hoÃ¡ÂºÂ·c mÃ¡ÂºÂ­t khÃ¡ÂºÂ©u khÃƒÂ´ng Ã„â€˜ÃƒÂºng' });
            }

            logLoginAttempt(normalizedEmail, true, req.ip, 'password');

            try {
                const otpCode = String(Math.floor(100000 + Math.random() * 900000));
                const otpExpiry = new Date(Date.now() + 1000 * 60 * 10);
                await Otp.create({ email: user.email, code: otpCode, expiresAt: otpExpiry });

                if (GMAIL_REFRESH_TOKEN) {
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

            return res.json({ success: true, needOtp: true, email: user.email });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'LÃ¡Â»â€”i server' });
        }
    },

    loginGoogle: async (req, res) => {
        try {
            const { credential } = req.body || {};
            if (!credential) {
                console.warn('[Google Login] Request body missing credential');
                return res.status(400).json({ success: false, message: 'Missing credential' });
            }

            if (!googleClient) {
                console.error('[Google Login] googleClient not initialized! CHECK GOOGLE_CLIENT_ID in .env');
                return res.status(500).json({ success: false, message: 'Google client not configured on server' });
            }

            let payload;
            try {
                console.log(`[Google Login] Verifying token for audience: ${GOOGLE_CLIENT_ID || 'MISSING'}`);
                const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
                payload = ticket.getPayload();
                console.log(`[Google Login] Token verified successfully for ${payload.email}`);
            } catch (e) {
                console.error('[Google Login] Token verification failed:', e.message);
                if (e.message?.includes('deleted_client')) {
                    console.error('[CRITICAL] The OAuth client ID used by the server is DELETED or INVALID.');
                }
                logLoginAttempt('unknown', false, req.ip, 'google');
                return res.status(401).json({ success: false, message: 'Invalid Google credential', details: e.message });
            }

            const email = normalizeEmail(payload.email);
            const name = payload.name || payload.email || 'Google User';

            if (!email) {
                console.warn('[Google Login] Payload missing email');
                return res.status(400).json({ success: false, message: 'Google token missing email' });
            }

            let user;
            try {
                user = await User.findOne({ email });
                if (!user) {
                    console.log(`[Google Login] Creating new user for ${email}`);
                    const randomPassword = Math.random().toString(36).slice(2);
                    const passwordHash = await hasher.hashPassword(randomPassword);
                    user = new User({ name: String(name).trim(), email, passwordHash });
                    await user.save();
                }
            } catch (dbErr) {
                console.error('[Google Login] Database operation failed:', dbErr.message);
                throw dbErr;
            }

            setLastGoogleLogin({ email: user.email, name: user.name, userId: String(user._id), at: new Date().toISOString() });
            console.log('Ã¢Å“â€¦ Google login success:', getLastGoogleLogin().email);
            logLoginAttempt(user.email, true, req.ip, 'google');

            const token = createAccessToken(user);

            return res.json({
                success: true,
                token,
                user: sanitizeUser(user)
            });
        } catch (err) {
            console.error('[Google Login Error] Fatal Exception:', err.message);
            return res.status(500).json({ success: false, message: 'LÃ¡Â»â€”i server', details: err.message });
        }
    },

    verifyOtp: async (req, res) => {
        try {
            const { email, code } = req.body || {};
            if (!email || !code) return res.status(400).json({ success: false, message: 'Missing email or code' });

            const normalizedEmail = normalizeEmail(email);
            const cleanCode = String(code).trim();
            const record = await Otp.findOne({ email: normalizedEmail, code: cleanCode });
            if (!record) {
                logOtpVerification(normalizedEmail, false);
                return res.status(400).json({ success: false, message: 'Invalid code' });
            }
            if (record.expiresAt < new Date()) {
                await Otp.deleteOne({ _id: record._id });
                logOtpVerification(normalizedEmail, false);
                return res.status(400).json({ success: false, message: 'Code expired' });
            }

            await Otp.deleteOne({ _id: record._id });
            const user = await User.findOne({ email: normalizedEmail });
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });

            const token = createAccessToken(user);

            logOtpVerification(normalizedEmail, true);
            return res.json({
                success: true,
                token,
                user: sanitizeUser(user)
            });
        } catch (err) {
            console.error('Error in /api/verify-otp', err);
            return res.status(500).json({ success: false, message: 'LÃ¡Â»â€”i server' });
        }
    },

    resendOtp: async (req, res) => {
        try {
            const { email } = req.body || {};
            if (!email) return res.status(400).json({ success: false, message: 'Missing email' });

            const cleanEmail = normalizeEmail(email);
            const user = await User.findOne({ email: cleanEmail });
            if (!user) return res.status(400).json({ success: false, message: 'NgÃ†Â°Ã¡Â»Âi dÃƒÂ¹ng khÃƒÂ´ng tÃ¡Â»â€œn tÃ¡ÂºÂ¡i' });

            await Otp.deleteMany({ email: cleanEmail });

            const otpCode = String(Math.floor(100000 + Math.random() * 900000));
            const otpExpiry = new Date(Date.now() + 1000 * 60 * 10);

            try {
                await Otp.create({ email: cleanEmail, code: otpCode, expiresAt: otpExpiry });
            } catch (e) {
                console.error('Failed to create new OTP record', e && e.message);
                return res.status(500).json({ success: false, message: 'KhÃƒÂ´ng thÃ¡Â»Æ’ tÃ¡ÂºÂ¡o mÃƒÂ£ xÃƒÂ¡c thÃ¡Â»Â±c' });
            }

            if (GMAIL_REFRESH_TOKEN) {
                sendEmailViaGmailAPI({
                    to: cleanEmail,
                    subject: 'FitShoes - MÃƒÂ£ xÃƒÂ¡c thÃ¡Â»Â±c mÃ¡Â»â€ºi',
                    text: `MÃƒÂ£ xÃƒÂ¡c thÃ¡Â»Â±c mÃ¡Â»â€ºi cÃ¡Â»Â§a bÃ¡ÂºÂ¡n lÃƒÂ : ${otpCode}\n\nMÃƒÂ£ sÃ¡ÂºÂ½ hÃ¡ÂºÂ¿t hÃ¡ÂºÂ¡n trong 10 phÃƒÂºt.\n\nVui lÃƒÂ²ng khÃƒÂ´ng chia sÃ¡ÂºÂ» mÃƒÂ£ nÃƒÂ y vÃ¡Â»â€ºi ai khÃƒÂ¡c.`
                });
                console.log(`Async resend OTP (Gmail API) initiated for ${cleanEmail}`);
            } else {
                console.warn('Gmail API credentials missing');
                return res.status(500).json({ success: false, message: 'HÃ¡Â»â€¡ thÃ¡Â»â€˜ng email khÃƒÂ´ng khÃ¡ÂºÂ£ dÃ¡Â»Â¥ng' });
            }

            return res.json({ success: true, message: 'MÃƒÂ£ xÃƒÂ¡c thÃ¡Â»Â±c mÃ¡Â»â€ºi Ã„â€˜ÃƒÂ£ Ã„â€˜Ã†Â°Ã¡Â»Â£c gÃ¡Â»Â­i' });
        } catch (err) {
            console.error('Error in /api/resend-otp', err);
            return res.status(500).json({ success: false, message: 'LÃ¡Â»â€”i server' });
        }
    },

    getMe: async (req, res) => {
        try {
            if (!dbConnectedRef()) return res.status(503).json({ success: false, message: 'Database unavailable' });
            if (!isValidObjectId(req.user.id)) {
                return res.status(400).json({ success: false, message: 'User ID invalid' });
            }

            const user = await User.findById(req.user.id);
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });

            return res.json({ success: true, user: sanitizeUser(user) });
        } catch (err) {
            console.error('Error in /api/me', err);
            return res.status(500).json({ success: false, message: 'LÃƒÂ¡Ã‚Â»Ã¢â‚¬â€i server' });
        }
    }
});
