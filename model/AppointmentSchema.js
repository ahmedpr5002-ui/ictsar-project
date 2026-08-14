// const mongoose = require('mongoose');
// const { Schema, Types } = mongoose; 

// const medicationSchema = new Schema({
//     name: { type: String, required: true },
//     dosage: { type: String }, // الجرعة مثل: 500mg
//     instruction: { type: String } // التعليمات مثل: بعد الأكل مرتين يومياً
// }, { _id: false });

// const appointmentSchema = new Schema({
//     // المريض الذي قام بالحجز
//     user: {
//         type: Types.ObjectId, 
//         ref: "User",
//         required: [true, "يجب تحديد المريض"]
//     },

//     // الطبيب المطلوب الحجز عنده
//     doctor: {
//         type: Types.ObjectId,
//         ref: "Doctor",
//         required: [true, "يجب تحديد الطبيب"]
//     },

//     // المنشأة الطبية (المجمع أو العيادة)
//     medicalEntity: {
//         type: Types.ObjectId,
//         ref: "MedicalEntity",
//         required: [true, "يجب تحديد المنشأة الطبية (المجمع/العيادة)"]
//     },

//     // وقت الموعد الفعلي
//     slot: {
//         type: Date, 
//         required: [true, "يجب تحديد وقت وتاريخ الموعد"]
//     },

//     // حالة الحجز
//     status: { 
//         type: String,
//         enum: {
//             values: ['pending', 'completed', 'cancelled', 'no_show'],
//             message: 'الحالة المدخلة للموعد غير صالحة'
//         }, 
//         default: 'pending'
//     },

//     // من قام بالحجز (boss/admin للحجز اليدوي، أو null للحجز العادي)
//     bookedBy: {
//         type: Types.ObjectId,
//         ref: "User",
//         default: null
//     },

//     // -----------------------------------------------------------------
//     // تفاصيل التشخيص والوصفة الطبية (تُعبأ عند وصول المريض للكشف)
//     // -----------------------------------------------------------------
//     diagnosis: {
//         type: String,
//         default: ""
//     },
//     prescription: {
//         type: String,
//         default: ""
//     },
//     medications: [medicationSchema],
//     prescriptionPreservedAt: {
//         type: Date // تاريخ ووقت إرسال الوصفة
//     }

// }, { 
//     timestamps: true 
// });

// // منع الحجز المزدوج لنفس الطبيب والمنشأة في نفس الوقت للمواعيد النشطة فقط
// appointmentSchema.index({ doctor: 1, medicalEntity: 1, slot: 1 }, { 
//     unique: true, 
//     partialFilterExpression: { status: { $nin: ['cancelled', 'no_show'] } } 
// });

// appointmentSchema.index({ user: 1 });
// appointmentSchema.index({ medicalEntity: 1 });

// const Appointment = mongoose.model('Appointment', appointmentSchema);
// module.exports = Appointment;
const mongoose = require('mongoose');
const { Schema, Types } = mongoose; 

const medicationSchema = new Schema({
    name: { type: String, required: true },
    dosage: { type: String }, // الجرعة مثل: 500mg
    instruction: { type: String } // التعليمات مثل: بعد الأكل مرتين يومياً
}, { _id: false });

const appointmentSchema = new Schema({
    // المريض الذي قام بالحجز
    user: {
        type: Types.ObjectId, 
        ref: "User",
        required: [true, "يجب تحديد المريض"]
    },

    // -----------------------------------------------------------------
    // بيانات المريض الخاصة بالحجز (الاسم الثلاثي، رقم الهاتف، العمر)
    // -----------------------------------------------------------------
    patientName: {
        type: String,
        required: [true, "يرجى تقديم اسم المريض الثلاثي"]
    },
    patientPhone: {
        type: String,
        required: [true, "يرجى تقديم رقم هاتف المريض"]
    },
    patientAge: {
        type: Number,
        required: [true, "يرجى تقديم عمر المريض"]
    },

    // الطبيب المطلوب الحجز عنده
    doctor: {
        type: Types.ObjectId,
        ref: "Doctor",
        required: [true, "يجب تحديد الطبيب"]
    },

    // المنشأة الطبية (المجمع أو العيادة)
    medicalEntity: {
        type: Types.ObjectId,
        ref: "MedicalEntity",
        required: [true, "يجب تحديد المنشأة الطبية (المجمع/العيادة)"]
    },

    // وقت الموعد الفعلي
    slot: {
        type: Date, 
        required: [true, "يجب تحديد وقت وتاريخ الموعد"]
    },

    // حالة الحجز
    status: { 
        type: String,
        enum: {
            values: ['pending', 'completed', 'cancelled', 'no_show'],
            message: 'الحالة المدخلة للموعد غير صالحة'
        }, 
        default: 'pending'
    },

    // من قام بالحجز (boss/admin للحجز اليدوي، أو null للحجز العادي)
    bookedBy: {
        type: Types.ObjectId,
        ref: "User",
        default: null
    },

    // -----------------------------------------------------------------
    // تفاصيل التشخيص والوصفة الطبية (تُعبأ عند وصول المريض للكشف)
    // -----------------------------------------------------------------
    diagnosis: {
        type: String,
        default: ""
    },
    prescription: {
        type: String,
        default: ""
    },
    medications: [medicationSchema],
    prescriptionPreservedAt: {
        type: Date // تاريخ ووقت إرسال الوصفة
    }

}, { 
    timestamps: true 
});

// منع الحجز المزدوج لنفس الطبيب والمنشأة في نفس الوقت للمواعيد النشطة فقط
appointmentSchema.index({ doctor: 1, medicalEntity: 1, slot: 1 }, { 
    unique: true, 
    partialFilterExpression: { status: { $nin: ['cancelled', 'no_show'] } } 
});

appointmentSchema.index({ user: 1 });
appointmentSchema.index({ medicalEntity: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;