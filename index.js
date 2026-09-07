

require("dotenv").config();
const express = require("express");
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const moment = require('moment-timezone');

const userRouter = require("./routes/user");
const ads = require("./routes/adsController");
const report = require("./routes/report");
const medicalRouter = require("./routes/medicalEntity");
const doctorRouter = require("./routes/doctor");
const doctorAppointment = require("./routes/Appointment");
const state = require("./routes/status");
const connectDB = require("./databases/mangodb"); 

// استدعاء النماذج لاستخدامها في تحديث الحجوزات تلقائياً
const Appointment = require("./model/AppointmentSchema");
const User = require("./model/UserSchema");

const TIMEZONE = "Asia/Riyadh";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------------------------------------------
// 🔥 Middleware لضمان الاتصال بقاعدة البيانات قبل تنفيذ أي Route على Vercel
// -------------------------------------------------------------
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("Database connection error:", error);
        res.status(500).json({ message: "خطأ في الاتصال بقاعدة البيانات", error: error.message });
    }
});

// -------------------------------------------------------------
// دالة تحديث الحجوزات المعلقة إلى لم يحضر (no_show)
// -------------------------------------------------------------
const checkAndExpireAppointments = async () => {
    try {
        const startOfToday = moment.tz(TIMEZONE).startOf('day').toDate();

        const expiredAppointments = await Appointment.find({
            slot: { $lt: startOfToday },
            status: 'pending'
        });

        if (expiredAppointments.length === 0) {
            return { success: true, count: 0, message: 'لا توجد حجوزات معلقة من الأيام السابقة.' };
        }

        const appointmentIds = expiredAppointments.map(app => app._id);
        await Appointment.updateMany(
            { _id: { $in: appointmentIds } },
            { $set: { status: 'no_show' } }
        );

        const userUpdatePromises = expiredAppointments.map(app => {
            return User.findByIdAndUpdate(app.user, { $inc: { missedAppointments: 1 } });
        });
        await Promise.all(userUpdatePromises);

        console.log(`✅ [CRON] تم تحديث (${expiredAppointments.length}) حجز إلى 'no_show' بنجاح.`);
        return { success: true, count: expiredAppointments.length };

    } catch (error) {
        console.error('❌ [CRON_ERROR] حدث خطأ أثناء تحديث الحجوزات:', error);
        return { success: false, error: error.message };
    }
};

// -------------------------------------------------------------
// API Trigger (مفيد للـ Serverless لربطه مع Cron خارجي أو استدعاء يدوي)
// -------------------------------------------------------------
app.get("/cron/process-expired-appointments", async (req, res) => {
    const result = await checkAndExpireAppointments();
    return res.status(200).json(result);
});

// الروترات الخاصة بالتطبيق
app.use("/user", userRouter);
app.use("/ads", ads);
app.use("/Appointment", doctorAppointment);
app.use("/doctor", doctorRouter);
app.use("/statues", state);
app.use("/medical", medicalRouter);
app.use("/report", report);

// -------------------------------------------------------------
// تشغيل السيرفر المحلي والـ Cron (في البيئة المحلية فقط)
// -------------------------------------------------------------
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });

    cron.schedule('0 0 * * *', async () => {
        console.log('🔄 [CRON] جاري فحص الحجوزات المنتهية عند الساعة 12 منتصف الليل...');
        await checkAndExpireAppointments();
    }, {
        scheduled: true,
        timezone: TIMEZONE
    });
}

// تصدير التطبيق مباشرة متوافق مع Vercel
module.exports = app;












