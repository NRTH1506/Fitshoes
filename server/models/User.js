const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
  canAccessAdmin: { type: Boolean, default: false, index: true },
  authorizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  authorizedAt: { type: Date, default: null },
  phone: { type: String, default: '' },
  gender: { type: String, enum: ['', 'male', 'female', 'other'], default: '' },
  address: { type: String, default: '' },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
