const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
    action: { type: String, required: true },
    adminId: { type: String, required: true },
    adminEmail: { type: String, required: true },
    targetType: { type: String },
    targetId: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    createdAt: { type: Date, default: Date.now }
});

adminLogSchema.index({ createdAt: -1 });
adminLogSchema.index({ adminId: 1 });

module.exports = mongoose.models.AdminLog || mongoose.model('AdminLog', adminLogSchema);
