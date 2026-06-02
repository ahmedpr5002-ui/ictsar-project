require("dotenv").config();
const express = require("express");
const serverless = require('serverless-http');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const path = require('path');

// استيراد الـ Routes والاتصال بقاعدة البيانات
const userRouter = require("./routes/user");
const doctorRouter = require("./routes/doctor");
const doctorAppointment = require("./routes/Appointment");
const connectDB = require("./databases/mangodb"); // تأكد من استيراد الملف

// 2. إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();

// --- أضف هذا السطر هنا للاتصال ---
connectDB(); 
// ---------------------------------

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// تعريف الـ Routes
app.use("/user", userRouter);
app.use("/Appointment", doctorAppointment);
app.use("/doctor", doctorRouter);

// الاستماع محلياً
if (process.env.NODE_ENV !== 'production') {
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;
module.exports.handler = serverless(app);