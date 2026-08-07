const mongoose = require('mongoose');
const { Schema, Types } = mongoose; 

const doctorSchema = new Schema({
  // ربط الطبيب بحسابه كمستخدم (يجب أن تكون صلاحيته doctor)
  // تم وضع unique لمنع تكرار إنشاء بروفايل لنفس الطبيب
  doctor: {
    type: Types.ObjectId, 
    ref: "User",
    required: [true, "يجب تحديد حساب المستخدم الخاص بالطبيب"],
    unique: true 
  },
  // داخل doctorSchema في ملف DoctorSchema.js
isBookingAllowed: {
  type: Boolean,
  default: true
},

  // العيادة أو المجمع الطبي الذي يعمل فيه الطبيب حالياً (مرتبط بالـ MedicalEntity)
  medicalEntity: {
    type: Types.ObjectId,
    ref: "MedicalEntity",
    required: [true, "يجب تحديد المنشأة الطبية التي يعمل بها الطبيب"]
  },

  // التخصص الطبي (مثال: أخصائي قلب وشرايين)
  specialty: {
    type: String,
    required: [true, "التخصص الطبي مطلوب"],
    trim: true
  },

  // نبذة تعريفية أو وصف عن الطبيب وخلفيته العلمية
  description: {
    type: String,
    required: [true, "النبذة التعريفية عن الطبيب مطلوبة"],
    trim: true
  },

  // سنوات الخبرة (مع التحقق ألا تكون القيمة سالبة)
  experience: {
    type: Number,
    required: [true, "سنوات الخبرة مطلوبة"],
    min: [0, "لا يمكن أن تكون سنوات الخبرة أقل من صفر"]
  },

 workingHours: {
  openTime: { type: String, default: "09:00" },      // صيغة 24 ساعة مثل: "08:30"
  closeTime: { type: String, default: "17:00" },     // صيغة 24 ساعة مثل: "16:30"
  slotDuration: { type: Number, default: 10 }        // المدة بالدقائق (مثلاً: 10, 15, 20)
},

  // حالة الطبيب (هل هو متاح لاستقبال الحجوزات حالياً؟)
  isAvailable: {
    type: Boolean,
    default: true
  }
  
}, { 
  timestamps: true 
});

const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;