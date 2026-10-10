const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../model/UserSchema"); // تأكد من المسار الصحيح
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const auth = require("../auth/jwt"); // ميدلوير التوثيق
const { OAuth2Client } = require("google-auth-library");

// تهيئة عميل جوجل باستخدام CLIENT_ID من ملف البيئة .env
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

router.post('/save-fcm-token', auth, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return res.status(400).json({ message: 'Token مطلوب' });

    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { fcmTokens: fcmToken }
    });

    return res.status(200).json({ message: 'تم حفظ رمز الإشعارات بنجاح' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. مسار للأدمن لإرسال إشعار لكافة المستخدمين
router.post('/send-broadcast', auth, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "boss") {
      return res.status(403).json({ message: "غير مصرح لك بإرسال الإشعارات العامة" });
    }

    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ message: "عنوان الإشعار ونصه مطلوبان" });
    }

    const users = await User.find({}, '_id');

    if (!users.length) {
      return res.status(400).json({ message: "لا يوجد مستخدمون في النظام" });
    }

    // حفظ سجل الإشعارات للمستخدمين ليتم جلبها عبر الـ API
    const notifications = users.map(u => ({
      userId: u._id,
      title: `إكتصار للخدمات الطبية - ${title}`,
      body: body,
      isRead: false,
      createdAt: new Date()
    }));

    // بفرض وجود موديل Notification في المشروع
    if (global.NotificationModel) {
      await global.NotificationModel.insertMany(notifications);
    }

    return res.status(200).json({
      message: `تم إرسال وحفظ الإشعار بنجاح لـ ${users.length} مستخدم`
    });

  } catch (error) {
    console.error("خطأ الإشعار الداخلي:", error);
    return res.status(500).json({
      message: "فشل في إرسال الإشعارات",
      error: error.message
    });
  }
});

// ==========================================
// 0. جلب بيانات المستخدم الحالي (جديد ومهم جداً للـ Profile)
// ==========================================
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }
    return res.status(200).json({ user, hasGovernorate: Boolean(user.governorate) });
  } catch (error) {
    return res.status(500).json({ message: "خطأ في السيرفر", error: error.message });
  }
});

// ==========================================
// 1. جلب قائمة المستخدمين
// ==========================================
router.get("/users", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "boss") {
      return res.status(403).json({ message: "غير مصرح لك بزيارة هذه الصفحة" });
    }

    const users = await User.find({}, "-password");
    return res.status(200).json({ message: "Success", users });
  } catch (error) {
    return res.status(500).json({ message: "خطأ في السيرفر أثناء جلب المستخدمين", error: error.message });
  }
});

// ==========================================
// 2. تسجيل حساب جديد تقليدياً
// ==========================================
router.post("/register", (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) return res.status(400).json({ message: "خطأ في رفع الصورة", error: err.message });
    
    try {
      const { name, email, password, governorate } = req.body;

      if (!password || password.length < 8) {
        return res.status(400).json({ message: "يجب أن لا تقل كلمة المرور عن 8 رموز" });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "البريد الإلكتروني مسجل بالفعل" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const imagePath = req.file ? req.file.path : ""; 

      const newUser = new User({ 
        name, 
        email, 
        password: hashedPassword, 
        image: imagePath,
        governorate: governorate || "",
        role: "user"
      });

      await newUser.save();

      const token = jwt.sign(
        { 
          id: newUser._id, 
          email: newUser.email, 
          name: newUser.name, 
          role: newUser.role,
          image: newUser.image || "",
          governorate: newUser.governorate || "",
          attendedAppointments: newUser.attendedAppointments || 0,
          missedAppointments: newUser.missedAppointments || 0
        }, 
        process.env.TOKEN_VAL
      );

      return res.status(201).json({ 
        message: "User created", 
        token, 
        user: newUser,
        hasGovernorate: Boolean(newUser.governorate)
      });
    } catch (error) { 
      return res.status(500).json({ error: error.message }); 
    }
  });
});

// ==========================================
// 3. تسجيل الدخول تقليدياً
// ==========================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const existingUser = await User.findOne({ email }).select("+password");
    if (!existingUser) return res.status(400).json({ message: "بيانات الاعتماد غير صالحة" });

    if (!existingUser.password) {
      return res.status(400).json({ message: "هذا الحساب مسجل باستخدام Google، يرجى الدخول عبر Google" });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) return res.status(400).json({ message: "بيانات الاعتماد غير صالحة" });
    
    const token = jwt.sign(
      { 
        id: existingUser._id, 
        email: existingUser.email, 
        name: existingUser.name, 
        role: existingUser.role,
        image: existingUser.image,
        governorate: existingUser.governorate || "",
        attendedAppointments: existingUser.attendedAppointments || 0,
        missedAppointments: existingUser.missedAppointments || 0
      },
      process.env.TOKEN_VAL
    );

    // تجهيز كائن المستخدم بدون كلمة المرور
    const userObj = existingUser.toObject();
    delete userObj.password;

    return res.status(200).json({ 
      message: "Login successful", 
      token, 
      user: userObj,
      hasGovernorate: Boolean(userObj.governorate)
    });
  } catch (error) { 
    return res.status(500).json({ error: error.message }); 
  }
});

// ==========================================
// 4. تسجيل الدخول / إنشاء حساب عبر Google
// ==========================================
router.post("/google-auth", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "رمز idToken مطلوب" });
    }

    const WEB_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "944016658908-urr28a5945cukhq09phtv9o2s8n2s04p.apps.googleusercontent.com";
    const ANDROID_CLIENT_ID = "944016658908-t2qd1dhbr560kqh2mht6eam7hfje19ig.apps.googleusercontent.com";

    // التمرير كـ Array يسمح بالتحقق من الـ Web والـ Android معاً
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: [WEB_CLIENT_ID, ANDROID_CLIENT_ID],
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: "البريد الإلكتروني غير متوفر في حساب Google" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
      const formattedName = name && name.trim() ? name.trim() : email.split('@')[0];

      user = new User({
        name: formattedName,
        email,
        password: randomPassword,
        image: picture || "",
        governorate: "",
        role: "user",
      });

      await user.save();
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image || "",
        governorate: user.governorate || "",
        attendedAppointments: user.attendedAppointments || 0,
        missedAppointments: user.missedAppointments || 0,
      },
      process.env.TOKEN_VAL
    );

    return res.status(200).json({
      message: "تم الدخول بنجاح عبر Google",
      token,
      hasGovernorate: Boolean(user.governorate),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        governorate: user.governorate || "",
        attendedAppointments: user.attendedAppointments || 0,
        missedAppointments: user.missedAppointments || 0,
      },
    });
  } catch (error) {
    console.error("خطأ Google Auth في الباك إيند:", error);
    return res.status(400).json({ 
      message: "فشل التحقق من حساب Google", 
      error: error.message 
    });
  }
});
// ==========================================
// جلب محافظة المستخدم الحالي
// ==========================================
router.get("/governorate", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("governorate");
    
    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    return res.status(200).json({
      governorate: user.governorate || "",
      hasGovernorate: Boolean(user.governorate)
    });
  } catch (error) {
    return res.status(500).json({ 
      message: "خطأ في السيرفر أثناء جلب المحافظة", 
      error: error.message 
    });
  }
});
// ==========================================
// 5. إضافة / تعديل المحافظة للمستخدم الحقيقي
// ==========================================
router.patch("/update-governorate", auth, async (req, res) => {
  try {
    const { governorate } = req.body;

    if (!governorate || !governorate.trim()) {
      return res.status(400).json({ message: "اسم المحافظة مطلوب" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { governorate: governorate.trim() },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    return res.status(200).json({
      message: "تم تحديث المحافظة بنجاح",
      governorate: updatedUser.governorate,
      user: updatedUser
    });
  } catch (error) {
    return res.status(500).json({ message: "خطأ في السيرفر أثناء تحديث المحافظة", error: error.message });
  }
});

// ==========================================
// 6. ترقية حساب إلى طبيب
// ==========================================
router.patch("/users/promote-to-doctor/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "boss") {
      return res.status(403).json({ message: "ليس لديك صلاحية لتغيير أدوار المستخدمين" });
    }

    const userId = req.params.id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: "doctor" },
      { new: true, runValidators: true }
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

router.get("/user-stats/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "خطأ في السيرفر", error: error.message });
  }
});
// ==========================================
// جلب صورة المستخدم الحالي فقط
// ==========================================
router.get("/avatar", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("image name");
    
    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    return res.status(200).json({
      image: user.image || "",
      name: user.name
    });
  } catch (error) {
    return res.status(500).json({ 
      message: "خطأ في السيرفر أثناء جلب الصورة", 
      error: error.message 
    });
  }
});
// ==========================================
// 7. تحديث الصورة الشخصية للمستخدم الحالي (مع حذف القديمة)
// ==========================================
router.patch("/update-avatar", auth, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: "خطأ في رفع الصورة", error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: "يرجى تحديد صورة لرفعها" });
      }

      // 1. جلب المستخدم الحالي لمعرفة رابط الصورة القديمة
      const currentUser = await User.findById(req.user.id);
      if (!currentUser) {
        return res.status(404).json({ message: "المستخدم غير موجود" });
      }

      // 2. إذا كان لديه صورة قديمة مخزنة على Cloudinary، قم بحذفها
      if (currentUser.image && currentUser.image.includes('cloudinary.com')) {
        try {
          // استخراج public_id من رابط Cloudinary
          // مثال على الرابط: https://res.cloudinary.com/.../image/upload/v123456/users_profiles/user-123456789.jpg
          const urlParts = currentUser.image.split('/');
          const folderAndFile = urlParts.slice(-2).join('/'); // يرجع مثلاً: users_profiles/user-123456789.jpg
          const publicId = folderAndFile.substring(0, folderAndFile.lastIndexOf('.')); // إزالة الامتداد

          await cloudinary.uploader.destroy(publicId);
        } catch (deleteError) {
          console.error("فشل في حذف الصورة القديمة من Cloudinary:", deleteError);
          // لا نوقف التنفيذ هنا لكي تتم عملية رفع الصورة الجديدة بنجاح حتى لو فشل حذف القديمة
        }
      }

      // 3. رابط الصورة الجديدة المرفوعة على Cloudinary
      const imageUrl = req.file.path; 

      // 4. تحديث قاعدة البيانات بالرابط الجديد
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { image: imageUrl },
        { new: true, runValidators: true }
      ).select("-password");

      return res.status(200).json({
        message: "تم تحديث الصورة الشخصية بنجاح",
        image: updatedUser.image,
        user: updatedUser
      });
    } catch (error) {
      return res.status(500).json({ message: "خطأ في السيرفر أثناء تحديث الصورة", error: error.message });
    }
  });
});

module.exports = router;