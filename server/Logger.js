// server/Logger.js - Base logger class for file-based logging

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const LogEntry = require('./models/LogEntry');

const LOG_DIR = path.join(__dirname, 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

class Logger {
  constructor(filename) {
    this.filename = path.join(LOG_DIR, filename);
    this.logType = filename.replace(/\.log$/i, '');
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };
    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
      fs.appendFileSync(this.filename, logLine);
    } catch (err) {
      console.error(`Failed to write to log file ${this.filename}:`, err.message);
    }

    // Mirror logs into MongoDB when available so admin/log pages can query centrally.
    if (mongoose.connection.readyState === 1) {
      LogEntry.create({
        timestamp: new Date(timestamp),
        level,
        message,
        logType: this.logType,
        data
      }).catch((err) => {
        console.error(`Failed to write log entry to database (${this.logType}):`, err.message);
      });
    }
    
    console.log(`[${level}] ${message}`, data);
  }

  info(message, data) { 
    this.log('INFO', message, data); 
  }

  error(message, data) { 
    this.log('ERROR', message, data); 
  }

  warn(message, data) { 
    this.log('WARN', message, data); 
  }

  debug(message, data) { 
    this.log('DEBUG', message, data); 
  }
}

module.exports = Logger;
