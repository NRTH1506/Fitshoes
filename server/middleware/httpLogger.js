// server/middleware/httpLogger.js - Middleware to log all HTTP requests

const Logger = require('../Logger');
const httpLogger = new Logger('http-requests.log');

function logHttpRequest(req, res, next) {
  const startTime = Date.now();
  
  // Intercept response to log status code
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const clientIp = req.ip || req.connection.remoteAddress;
    
    httpLogger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      url: req.originalUrl,
      statusCode: res.statusCode,
      clientIp,
      userAgent: req.get('user-agent') || 'Unknown',
      duration: `${duration}ms`,
      userId: req.user?.id || 'anonymous'
    });
    
    return originalSend.call(this, data);
  };
  
  next();
}

module.exports = logHttpRequest;
