const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const medicalComplexSchema = new Schema({
  name: {
    type: String,
    required: [true, 'اسم المجمع الطبي مطلوب'],
    trim: true
  },

  entityType: {
    type: String,
    enum: ['private_clinic', 'medical_center', 'hospital'],
    default: 'medical_center'
  },
  
  logo: {
    type: String
  },
  
  description: {
    type: String,
    trim: true
  },

  isBookingAllowed: {
    type: Boolean,
    default: true
  },
  
  bookingPauseReason: {
    type: String,
    trim: true,
    default: ""
  },

  subscriptionEndDate: {
    type: Date,
    default: null
  },
  
  subscriptionStatus: {
    type: String,
    enum: ['active', 'expired', 'none'],
    default: 'none'
  },

  // المالك فقط
  owner: {
    type: Types.ObjectId,
    ref: 'User',
    required: [true, 'يجب تحديد مالك المجمع الطبي']
  },

  doctors: [{
    type: Types.ObjectId,
    ref: 'User'
  }],

  specialties: [{
    type: String
  }],

  workingHours: [{
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

  phones: [{
    type: String
  }],

  // 📍 هيكل الموقع المطور لدعم GeoJSON والاستعلامات الجغرافية
  location: {
    city: { type: String, required: [true, 'المدينة مطلوبة'] },
    address: { type: String, required: [true, 'عنوان المجمع تفصيلاً مطلوب'] },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      // ⚠️ الترتيب المعتمد في GeoJSON: [خط الطول Longitude, خط العرض Latitude]
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },
    googleMapsUrl: { type: String, default: '' }
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🌟 الفهارس (Indexes)
// 1. فهرس جغرافيا مكاني للبحث عن المجمعات الأقرب
medicalComplexSchema.index({ "location.coordinates": "2dsphere" });

// 2. الفهارس النصية وفهارس العلاقات
medicalComplexSchema.index({ name: 'text', specialties: 'text', description: 'text' });
medicalComplexSchema.index({ owner: 1 });

// 🌟 Pre-save Hook لبناء رابط Google Maps تلقائياً
medicalComplexSchema.pre('save', function () {
  const coords = this.location?.coordinates?.coordinates;
  
  // التأكد من وجود الإحداثيات وقيمها الصحيحة [lng, lat]
  if (Array.isArray(coords) && coords.length === 2) {
    const [lng, lat] = coords;
    if (lng !== 0 || lat !== 0) {
      this.location.googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }
  }
});

// 🌟 Virtual Properties لسهولة قراءة Lat و Lng مباشرة في الفرونت إند
medicalComplexSchema.virtual('location.lat').get(function () {
  return this.location?.coordinates?.coordinates?.[1] ?? null;
});

medicalComplexSchema.virtual('location.lng').get(function () {
  return this.location?.coordinates?.coordinates?.[0] ?? null;
});

const MedicalComplex = mongoose.model('MedicalEntity', medicalComplexSchema);
module.exports = MedicalComplex;