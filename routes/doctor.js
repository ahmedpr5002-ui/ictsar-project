const express = require("express");
const auth = require("../auth/jwt");
const router = express.Router();
const Doctor = require("../model/DoctorSchema");
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// إعداد التخزين ليتم الرفع إلى Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'doctors_images',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], // أضفنا webp هنا
    public_id: (req, file) => 'doctor-' + Date.now()
  },
});

const upload = multer({ storage: storage });

// استخدام دالة المعالجة اليدوية لالتقاط أخطاء الرفع
router.post("/Doctor", auth, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    // 1. معالجة أخطاء الرفع (مثل الصيغ غير المدعومة)
    if (err) {
      console.error("خطأ من Multer (Doctor):", err);
      return res.status(400).json({ message: "خطأ في رفع الصورة", error: err.message });
    }

    // 2. التحقق من الصلاحيات
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "auth error", admin: req.user.role });
    }

    try {
      const { name, specialty, expier, des } = req.body;

      // 3. التحقق من البيانات
      if (!name || !specialty || !expier || !des || !req.file) {
        return res.status(400).json({ message: "all info and image are required" });
      }

      // 4. الحفظ في قاعدة البيانات
      const newDoc = new Doctor({
        name,
        specialty,
        des,
        expier,
        image: req.file.path
      });

      await newDoc.save();
      return res.status(201).json({ message: "created the doc :)", data: newDoc });

    } catch (error) {
      console.error("خطأ في الخادم:", error);
      return res.status(500).json({ message: "error in server", error: error.message });
    }
  });
});

router.get("/Doctors", async (req, res) => {
  try {
    const doctors = await Doctor.find();
    return res.status(200).json({ message: "True", doctors: doctors });
  } catch (error) {
    return res.status(500).json({ message: "error in server", error: error.message });
  }
});

module.exports = router;