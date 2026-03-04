const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Basic admin auth: check x-admin-key header matches ADMIN_KEY env var.
// In production, set ADMIN_KEY to a strong secret. In dev the default is 'dev-admin-key'.
const ADMIN_KEY = process.env.ADMIN_KEY || 'dev-admin-key';

function adminAuth(req, res, next) {
  // allow in dev if ADMIN_KEY left default and NODE_ENV != 'production'
  if (process.env.NODE_ENV !== 'production' && ADMIN_KEY === 'dev-admin-key') return next();
  const key = req.get('x-admin-key');
  if (!key || key !== ADMIN_KEY) return res.status(401).json({ success: false, message: 'Unauthorized' });
  return next();
}

// POST /admin/products
router.post('/products', adminAuth, async (req, res) => {
  try {
    let { name, title_vi, price, oldPrice, currency, description, description_vi, images, category, stock, gender } = req.body || {};
    let title = name ? String(name).trim() : (title_vi ? String(title_vi).trim() : '');
    if (!name && !title_vi) return res.status(400).json({ success: false, message: 'Thiếu tên sản phẩm' });
    if (price === undefined || price === null || isNaN(Number(price))) return res.status(400).json({ success: false, message: 'Giá không hợp lệ' });

    // Chỉ trim, không chuyển về lowercase
    if (name) name = String(name).trim();
    if (title_vi) title_vi = String(title_vi).trim();

    // Đảm bảo images là mảng các link hợp lệ
    let imageArr = [];
    if (typeof images === 'string') {
      imageArr = images.split(',').map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(images)) {
      imageArr = images.map(String).map(s => s.trim()).filter(Boolean);
    } else if (images) {
      imageArr = [String(images).trim()];
    }

    const product = new Product({
      name: name ? name : (title_vi ? title_vi : ''),
      title,
      title_vi: title_vi ? title_vi : undefined,
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : undefined,
      currency: currency || 'VND',
      description: description ? String(description) : undefined,
      description_vi: description_vi ? String(description_vi) : undefined,
      images: imageArr,
      category: category ? String(category) : 'general',
      stock: stock ? Number(stock) : 0,
      gender: ['male','female','unisex'].includes(gender) ? gender : 'unisex'
    });

    await product.save();
    return res.status(201).json({ success: true, message: 'Sản phẩm được thêm', product });
  } catch (err) {
    console.error('Admin POST /admin/products error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
