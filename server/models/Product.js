const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    title_vi: { type: String, required: true },
    price: { type: Number, required: true },
    salePrice: { type: Number, default: null },
    saleEndDate: { type: Date, default: null },
    currency: { type: String, default: 'VND' },
    brand: { type: String, default: '' },
    description_vi: { type: String },
    images: { type: [String], default: [] },
    gender: { type: String, enum: ['male', 'female', 'unisex'], default: 'unisex' },
    category: { type: String, enum: ['running', 'gym', 'casual', 'sandals', 'boots', 'other'], default: 'other' },
    inventory: [{
        size: { type: Number, required: true },
        quantity: { type: Number, default: 0 }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
