const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  revoked: { type: Boolean, default: false },
  replacedByToken: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
