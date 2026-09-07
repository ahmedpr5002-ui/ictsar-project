const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const auth = require('../auth/jwt'); // ميدلوير التوثيق الخاص بك
const Report = require('../model/ReportSchema');

// إعداد التخزين لصور البلاغات على Cloudinary
const reportStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'app_reports',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    public_id: (req, file) => `report-${Date.now()}-${Math.round(Math.random() * 1e9)}`
  }
});

const uploadReport = multer({ 
  storage: reportStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // حد أقصى 5 ميجابايت للصورة
});

// إنشاء بلاغ جديد (مع رفع حتى 3 صور)
// إنشاء بلاغ جديد مع التقاط أخطاء Multer و Cloudinary
router.post('/create', auth, (req, res, next) => {
  uploadReport.array('images', 3)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `خطأ في رفع الملفات: ${err.message}` });
    } else if (err) {
      return res.status(500).json({ message: `فشل الرفع: ${err.message}` });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { title, category, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'يرجى إدخال عنوان المشكلة والتفاصيل' });
    }

    const imageUrls = req.files ? req.files.map(file => file.path) : [];

    const newReport = new Report({
      userId: req.user.id,
      title,
      category,
      description,
      images: imageUrls
    });

    await newReport.save();

    return res.status(201).json({
      message: 'تم إرسال البلاغ بنجاح، وسيتم مراجعته من قبل الفريق الفني',
      report: newReport
    });
  } catch (error) {
    return res.status(500).json({ message: 'حدث خطأ أثناء تقديم البلاغ', error: error.message });
  }
});

// جلب البلاغات الخاصة بالمستخدم الحالي
router.get('/my-reports', auth, async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ reports });
  } catch (error) {
    return res.status(500).json({ message: 'فشل في جلب البلاغات', error: error.message });
  }
});
// جلب جميع البلاغات (خاص بالأدمن والـ boss)
router.get("/all", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "boss") {
      return res.status(403).json({ message: "غير مصرح لك بزيارة هذه الصفحة" });
    }

    // جلب البلاغات مع بيانات المستخدم (الاسم والبريد)
    const reports = await Report.find()
      .populate("userId", "name email image")
      .sort({ createdAt: -1 });

    return res.status(200).json({ reports });
  } catch (error) {
    return res.status(500).json({ message: "فشل في جلب البلاغات", error: error.message });
  }
});

// تحديث حالة البلاغ (خاص بالأدمن)
router.patch("/status/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "boss") {
      return res.status(403).json({ message: "غير مصرح لك بإجراء هذا التعديل" });
    }

    const { status } = req.body;
    const allowedStatuses = ["pending", "in_progress", "resolved", "rejected"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "حالة غير صالحة" });
    }

    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedReport) {
      return res.status(404).json({ message: "البلاغ غير موجود" });
    }

    return res.status(200).json({ message: "تم تحديث حالة البلاغ بنجاح", report: updatedReport });
  } catch (error) {
    return res.status(500).json({ message: "حدث خطأ أثناء التحديث", error: error.message });
  }
});

module.exports = router;