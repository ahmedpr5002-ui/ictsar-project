const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

const Ad = require("../model/AdSchema"); // التأكد من المسار لديك
const auth = require("../auth/jwt"); // ميدلوير التوثيق

// 1. إعداد التخزين لصور الإعلانات في Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ads_banners",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    public_id: (req, file) => `ad-${Date.now()}`,
  },
});

const upload = multer({ storage: storage });

// 2. ميدلوير التحقق من صلاحية الأدمن 
const checkAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "boss")) {
    return next();
  }
  return res.status(403).json({ message: "غير مصرح لك بالقيام بهذا الإجراء" });
};

// ==========================================
// Controllers (دوال المعالجة)
// ==========================================

// جلب الإعلانات النشطة فقط (عام للجميع)
const getActiveAds = async (req, res) => {
  try {
    const ads = await Ad.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    return res.status(200).json({ success: true, count: ads.length, ads });
  } catch (error) {
    return res.status(500).json({ message: "خطأ في جلب الإعلانات", error: error.message });
  }
};

// جلب جميع الإعلانات (لوحة التحكم)
const getAllAds = async (req, res) => {
  try {
    const ads = await Ad.find().sort({ order: 1, createdAt: -1 });
    return res.status(200).json({ success: true, count: ads.length, ads });
  } catch (error) {
    return res.status(500).json({ message: "خطأ في جلب الإعلانات", error: error.message });
  }
};

// إضافة إعلان جديد
const createAd = async (req, res) => {
  try {
    const { title, subtitle, badge, link, order, isActive } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "يرجى رفع صورة للإعلان" });
    }

    const newAd = new Ad({
      title,
      subtitle,
      badge,
      link,
      order: order ? Number(order) : 0,
      isActive: isActive !== undefined ? isActive : true,
      image: req.file.path, // رابط الصورة من Cloudinary
    });

    await newAd.save();
    return res.status(201).json({ message: "تم إنشاء الإعلان بنجاح", ad: newAd });
  } catch (error) {
    return res.status(500).json({ message: "خطأ أثناء إضافة الإعلان", error: error.message });
  }
};

// تعديل إعلان
const updateAd = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // إذا تم رفع صورة جديدة
    if (req.file) {
      updateData.image = req.file.path;
    }

    const updatedAd = await Ad.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedAd) {
      return res.status(404).json({ message: "الإعلان غير موجود" });
    }

    return res.status(200).json({ message: "تم تحديث الإعلان بنجاح", ad: updatedAd });
  } catch (error) {
    return res.status(500).json({ message: "خطأ أثناء تحديث الإعلان", error: error.message });
  }
};

// حذف إعلان
const deleteAd = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAd = await Ad.findByIdAndDelete(id);

    if (!deletedAd) {
      return res.status(404).json({ message: "الإعلان غير موجود" });
    }

    return res.status(200).json({ message: "تم حذف الإعلان بنجاح" });
  } catch (error) {
    return res.status(500).json({ message: "خطأ أثناء حذف الإعلان", error: error.message });
  }
};

// ==========================================
// Routes (ربط المسارات)
// ==========================================

// مسار عام للعملاء/المستخدمين
router.get("/ads", getActiveAds);

// مسارات التحكم الخاصة بالأدمن
router.get("/ads/all", auth, checkAdmin, getAllAds);
router.post("/ads", auth, checkAdmin, upload.single("image"), createAd);
router.put("/ads/:id", auth, checkAdmin, upload.single("image"), updateAd);
router.delete("/ads/:id", auth, checkAdmin, deleteAd);

module.exports = router;