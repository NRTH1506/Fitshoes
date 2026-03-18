const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    title_vi: { type: String, required: true },
    price: { type: Number, required: true },
    oldPrice: { type: Number },
    currency: { type: String, default: 'VND' },
    brand: { type: String, default: '' },
    description_vi: { type: String },
    images: { type: [String], default: [] },
    gender: { type: String, enum: ['male', 'female', 'unisex'], default: 'unisex' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
