const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
    action: { type: String, required: true },      // e.g. 'GRANT_ACCESS', 'DELETE_USER', 'SET_SALE', 'ADD_PRODUCT', 'UPDATE_PRODUCT', 'DELETE_PRODUCT', 'UPDATE_ORDER_STATUS'
    adminId: { type: String, required: true },
    adminEmail: { type: String, required: true },
    targetType: { type: String },                   // 'user', 'product', 'order'
    targetId: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },  // additional details about the action
    ip: { type: String },
    createdAt: { type: Date, default: Date.now }
});

adminLogSchema.index({ createdAt: -1 });
adminLogSchema.index({ adminId: 1 });

module.exports = mongoose.models.AdminLog || mongoose.model('AdminLog', adminLogSchema);
