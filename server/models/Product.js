const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
   title: { type: String },
  price: { type: Number, required: true },
  currency: { type: String, default: 'VND' },
  brand: { type: String, default: '' },
  description: { type: String },
  images: { type: [String], default: [] },
  category: { type: String, default: 'general' },
  stock: { type: Number, default: 0 },
  gender: { type: String, enum: ['male', 'female', 'unisex'], default: 'unisex' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Products', productSchema);
