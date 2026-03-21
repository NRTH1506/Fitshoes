const createAuthController = require('../controllers/auth.controller');

module.exports = ({
    User,
    Otp,
    authLimiter,
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
    authenticateJWT,
    getLastGoogleLogin,
    setLastGoogleLogin
}) => {
    const router = require("express").Router();
    const controller = createAuthController({
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
    });

    router.post('/register', authLimiter, controller.register);
    router.post('/login', authLimiter, controller.login);
    router.post('/login-google', controller.loginGoogle);
    router.post('/verify-otp', authLimiter, controller.verifyOtp);
    router.post('/resend-otp', controller.resendOtp);
    router.get('/me', authenticateJWT, controller.getMe);

    return router;
};
