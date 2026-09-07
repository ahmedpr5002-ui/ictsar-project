const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'عنوان المشكلة مطلوب'],
    trim: true,
    maxlength: 120
  },
  category: {
    type: String,
    enum: ['technical', 'ui_ux', 'appointments', 'account', 'other'],
    default: 'technical'
  },
  description: {
    type: String,
    required: [true, 'وصف المشكلة مطلوب'],
    trim: true,
    maxlength: 1000
  },
  images: [{
    type: String // روابط الصور المرفوعة عبر Cloudinary
  }],
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);