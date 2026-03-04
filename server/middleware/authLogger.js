// server/middleware/authLogger.js - Authentication and security logging

const Logger = require('../Logger');
const authLogger = new Logger('authentication.log');

function logLoginAttempt(email, success, ip, method = 'password') {
  authLogger.info(success ? 'Login Success' : 'Login Failed', {
    email,
    method,
    success,
    clientIp: ip,
    timestamp: new Date().toISOString()
  });
}

function logAccessDenied(userId, endpoint, ip) {
  authLogger.warn('Access Denied', {
    userId,
    endpoint,
    clientIp: ip,
    timestamp: new Date().toISOString()
  });
}

function logPasswordChange(userId, email) {
  authLogger.info('Password Changed', {
    userId,
    email,
    timestamp: new Date().toISOString()
  });
}

function logOtpVerification(email, success) {
  authLogger.info(success ? 'OTP Verified' : 'OTP Verification Failed', {
    email,
    success,
    timestamp: new Date().toISOString()
  });
}

module.exports = { 
  logLoginAttempt, 
  logAccessDenied, 
  logPasswordChange,
  logOtpVerification
};
