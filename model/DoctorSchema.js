const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const doctorSchema = new Schema({
  doctor: {
    type: Types.ObjectId,
    ref: "User",
    required: [true, "يجب تحديد حساب المستخدم الخاص بالطبيب"],
    unique: true
  },
  medicalEntity: {
    type: Types.ObjectId,
    ref: "MedicalEntity",
    required: [true, "يجب تحديد المنشأة الطبية التي يعمل بها الطبيب"]
  },
  specialty: {
    type: String,
    required: [true, "التخصص الطبي مطلوب"],
    trim: true
  },
  description: {
    type: String,
    required: [true, "النبذة التعريفية عن الطبيب مطلوبة"],
    trim: true
  },
  experience: {
    type: Number,
    required: [true, "سنوات الخبرة مطلوبة"],
    min: [0, "لا يمكن أن تكون سنوات الخبرة أقل من صفر"]
  },
  isBookingAllowed: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  // أيام العمل والتفاصيل الخاصة بكل يوم
  workingDays: [{
    day: {
      type: String,
      required: true,
      enum: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    },
    from: { type: String, default: '09:00' },
    to: { type: String, default: '17:00' },
    slotDuration: { type: Number, default: 15 },
    isClosed: { type: Boolean, default: false }
  }],
  // أوقات العمل العامة (Fallback)
  workingHours: {
    openTime: { type: String, default: "09:00" },
    closeTime: { type: String, default: "17:00" },
    slotDuration: { type: Number, default: 15 }
  },
  // التواريخ المغلقة استثنائياً
  unavailableDates: [{
    date: { type: Date, required: true },
    reason: { type: String, default: '' },
    createdBy: { type: Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;