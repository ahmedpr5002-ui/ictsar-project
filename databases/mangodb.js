const mongoose = require("mongoose");

// متغير لحفظ حالة الاتصال
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) {
        return cached.conn; // إذا كان هناك اتصال مفتوح، استخدمه
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false, // تعطيل التخزين المؤقت لتجنب رسالة الخطأ التي واجهتها
        };

        
        // إنشاء وعد للاتصال
        cached.promise = mongoose.connect(process.env.DATA_URL, opts).then((mongoose) => {
            return mongoose;
        });
    }

    cached.conn = await cached.promise;
    console.log("MongoDB Connected Successfully");
    return cached.conn;
};

module.exports = connectDB;