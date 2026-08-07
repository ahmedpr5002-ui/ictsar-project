const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../model/UserSchema"); // تأكد من اسم ومسار الملف لديك
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const auth = require("../auth/jwt"); // ميدلوير التوثيق

// إعداد التخزين السحابي لـ Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'users_profiles',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
    public_id: (req, file) => `user-${Date.now()}`
  },
});

const upload = multer({ storage: storage });
// ==========================================
// 1. جلب قائمة المستخدمين (للعرض في الواجهة)
// ==========================================
router.get("/users", auth, async (req, res) => {
  try {
    // التحقق من صلاحيات الأدمن أو Boss
    if (req.user.role !== "admin" && req.user.role !== "boss") {
      return res.status(403).json({ message: "غير مصرح لك بزيارة هذه الصفحة" });
    }

    // جلب جميع المستخدمين أو تصفية العاديين فقط حسب الحاجة
    // يمكنك تعديل الاستعلام إلى User.find({ role: "user" }) إذا أردت عرض المستخدمين العاديين فقط
    const users = await User.find({}, "-password"); // استثناء كلمة المرور للأمان

    return res.status(200).json({ message: "Success", users });
  } catch (error) {
    return res.status(500).json({ message: "خطأ في السيرفر أثناء جلب المستخدمين", error: error.message });
  }
});
router.post("/register", (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) return res.status(400).json({ message: "خطأ في رفع الصورة", error: err.message });
    
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "البريد الإلكتروني مسجل بالفعل" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      // ✅ نستخدم null أو نص فارغ بدلاً من undefined
      const imagePath = req.file ? req.file.path : ""; 

      const newUser = new User({ 
        name, 
        email, 
        password: hashedPassword, 
        image: imagePath,
        role: "user"
      });

      await newUser.save();

      // ✅ تضمين حقل image صراحةً
      const token = jwt.sign(
        { 
          id: newUser._id, 
          email: newUser.email, 
          name: newUser.name, 
          role: newUser.role,
          image: newUser.image || "" // تضمن عدم كونها undefined
        }, 
        process.env.TOKEN_VAL
      );

      return res.status(201).json({ message: "User created", token });
    } catch (error) { 
      return res.status(500).json({ error: error.message }); 
    }
  });
});

// روت تسجيل الدخول الجديد
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // جلب المستخدم مع حقل الـ password المخفي افتراضياً
    const existingUser = await User.findOne({ email }).select("+password");
    if (!existingUser) return res.status(400).json({ message: "بيانات الاعتماد غير صالحة" });

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) return res.status(400).json({ message: "بيانات الاعتماد غير صالحة" });
    
    // تم حذف { expiresIn } لضمان بقاء جلسة تسجيل الدخول مفتوحة دائماً
    const token = jwt.sign(
      { 
        id: existingUser._id, 
        email: existingUser.email, 
        name: existingUser.name, // تعديل username إلى name
        role: existingUser.role,
        image: existingUser.image 
      },
      process.env.TOKEN_VAL
    );

    return res.status(200).json({ message: "Login successful", token });
  } catch (error) { 
    return res.status(500).json({ error: error.message }); 
  }
});
router.patch("/users/promote-to-doctor/:id", auth, async (req, res) => {
  try {
    // التحقق من الصلاحيات (أدمن أو مدير فقط)
    if (req.user.role !== "admin" && req.user.role !== "boss") {
      return res.status(403).json({ message: "ليس لديك صلاحية لتغيير أدوار المستخدمين" });
    }

    const userId = req.params.id;

    // البحث عن المستخدم وتحديث دوره إلى doctor
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: "doctor" },
      { new: true, runValidators: true } // new: true ترجع البيانات بعد التحديث
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    return res.status(200).json({
      message: "تم تحديث دور المستخدم إلى طبيب بنجاح",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: "خطأ في السيرفر أثناء تحديث دور المستخدم", error: error.message });
  }
});

module.exports = router;