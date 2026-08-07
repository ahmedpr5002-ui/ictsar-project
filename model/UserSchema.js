const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'اسم المستخدم مطلوب'],
    trim: true,
    minlength: [2, 'يجب أن يكون الاسم من حرفين على الأقل'],
    maxlength: [30, 'الاسم طويل جداً'],
    match: [/^[a-zA-Z0-9\u0600-\u06FF\s]+$/, 'يجب أن يحتوي الاسم على حروف وأرقام ومسافات فقط']
  },
  email: {
    type: String,
    required: [true, 'البريد الإلكتروني مطلوب'],
    unique: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'البريد الإلكتروني غير صالح'] 
  },
  password: {
    type: String,
    required: [true, 'كلمة المرور مطلوبة'],
    minlength: [8, 'يجب أن لا تقل كلمة المرور عن 8 رموز'],
    select: false 
  },
  role: {
    type: String,
    enum: ['user', 'admin','doctor','boss'],
    default: 'user'
  },
  image: String,
  
  // -- الإضافات الجديدة --
  attendedAppointments: {
    type: Number,
    default: 0,
    min: 0 // لضمان عدم تسجيل قيم سالبة
  },
  missedAppointments: {
    type: Number,
    default: 0,
    min: 0
  }
}, { 
  timestamps: true 
});

const User = mongoose.model('User', userSchema);
module.exports = User;