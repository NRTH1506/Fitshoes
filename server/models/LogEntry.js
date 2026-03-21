const mongoose = require('mongoose');

const logEntrySchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now, index: true },
    level: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    logType: { type: String, required: true, trim: true, index: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.models.LogEntry || mongoose.model('LogEntry', logEntrySchema);
