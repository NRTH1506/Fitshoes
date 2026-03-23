

const Logger = require('../Logger');
const errorLogger = new Logger('errors.log');

function logError(err, req, res, next) {
  const clientIp = req.ip || req.connection.remoteAddress;

  errorLogger.error('Exception Occurred', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    statusCode: res.statusCode || 500,
    clientIp,
    userId: req.user?.id || 'anonymous',
    body: req.body ? Object.keys(req.body) : [],
    timestamp: new Date().toISOString()
  });

  res.status(err.status || 500).json({
    success: false,
    message: 'Internal Server Error',
    errorId: new Date().getTime()
  });
}

module.exports = logError;
