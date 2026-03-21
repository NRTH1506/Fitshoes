const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: String, default: '' },
  items: { type: Array, default: [] },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, default: 'ZALOPAY' },
  paymentChannel: { type: Number, default: 38 },
  app_trans_id: { type: String, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    default: 'PENDING'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
