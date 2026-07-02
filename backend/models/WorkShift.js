const mongoose = require('mongoose');

const workShiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  }
}, { timestamps: true });

workShiftSchema.index({ name: 1, organization: 1 }, { unique: true });

module.exports = mongoose.model('WorkShift', workShiftSchema);
