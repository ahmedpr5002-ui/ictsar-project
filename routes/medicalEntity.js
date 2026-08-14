const express = require("express");
const router = express.Router();
const multer = require("multer");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// الاستيرادات الخاصة بالتوثيق وقواعد البيانات
const MedicalEntity = require("../model/MedicalcomplexSchema");
const Doctor = require("../model/DoctorSchema");
const User = require("../model/UserSchema"); // 👈 1. استيراد موديل المستخدم لترقية دوره
const authMiddleware = require("../auth/jwt");

// =====================================================================
// 🛠️ 1. إعدادات التخزين السحابي (Cloudinary & Multer Setup)
// =====================================================================
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "medical_entities_logos",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    public_id: (req, file) => `entity-${Date.now()}`,
  },
});

const upload = multer({ storage: storage });

// =====================================================================
// 🛠️ 2. دالة مساعدة لفك صيغ البيانات وتحويل Location إلى GeoJSON
// =====================================================================
// =====================================================================
// 🛠️ 2. دالة مساعدة لفك صيغ البيانات وتحويل Location إلى GeoJSON
// =====================================================================
const parseFormDataFields = (body) => {
  const fieldsToParse = ["specialties", "location", "phones", "workingHours", "doctors"];
  const parsedBody = { ...body };

  // 1. فك الحقول النصية القادمة من JSON.stringify عبر Form-Data
  fieldsToParse.forEach((field) => {
    if (typeof parsedBody[field] === "string") {
      try {
        parsedBody[field] = JSON.parse(parsedBody[field]);
      } catch (e) {
        // في حال فشل الفك يتم الإبقاء على القيمة الأصلية
      }
    }
  });

  // 2. تحويل هيكل location إلى صيغة GeoJSON تلقائياً
  if (parsedBody.location) {
    let lat = null;
    let lng = null;

    const loc = parsedBody.location;

    // حالة أ: إذا كانت lat و lng داخل location كأرقام مباشرة { lat: ..., lng: ... }
    if (loc.lat !== undefined && loc.lng !== undefined) {
      lat = parseFloat(loc.lat);
      lng = parseFloat(loc.lng);
    } 
    // حالة ب: إذا تم إرسال coordinates كمصفوفة [lng, lat]
    else if (Array.isArray(loc.coordinates)) {
      lng = parseFloat(loc.coordinates[0]);
      lat = parseFloat(loc.coordinates[1]);
    }
    // حالة ج: إذا كانت coordinates ممررة كـ Object { lat: ..., lng: ... }
    else if (typeof loc.coordinates === "object" && loc.coordinates !== null) {
      lat = parseFloat(loc.coordinates.lat);
      lng = parseFloat(loc.coordinates.lng);
    }

    // التأكد من صحة القيم وعدم كونها NaN
    const validLng = !isNaN(lng) && lng !== null ? lng : 0;
    const validLat = !isNaN(lat) && lat !== null ? lat : 0;

    // إعادة بناء كائن location بالهيكل المطلوب للـ Schema الفعلي
    parsedBody.location = {
      city: loc.city || parsedBody.city || "غير محدد",
      address: loc.address || parsedBody.address || "غير محدد",
      coordinates: {
        type: "Point",
        coordinates: [validLng, validLat] // [Longitude, Latitude]
      }
    };
  }

  return parsedBody;
};

// =====================================================================
// 👑 3. روتات لوحة الإدارة (Admin Routes)
// =====================================================================

router.get("/admin/stats", authMiddleware, async (req, res) => {
  try {
    if (!["admin", "boss"].includes(req.user.role)) {
      return res.status(403).json({ message: "غير مصرح لك بالوصول" });
    }

    const totalEntities = await MedicalEntity.countDocuments();
    const activeEntities = await MedicalEntity.countDocuments({ isActive: true });
    const inactiveEntities = await MedicalEntity.countDocuments({ isActive: false });

    return res.status(200).json({
      success: true,
      stats: {
        total: totalEntities,
        active: activeEntities,
        inactive: inactiveEntities,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
// روت لجلب المستخدمين المتاحين للتعيين كمدراء أو أطباء
router.get("/admin/users-list", authMiddleware, async (req, res) => {
  try {
    if (!["admin", "boss"].includes(req.user.role)) {
      return res.status(403).json({ message: "غير مصرح لك بالوصول" });
    }

    const { search } = req.query;
    let filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // جلب الاسم، الإيميل والصورة فقط للتخفيف
    const users = await User.find(filter).select("name email image role");

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
router.get("/admin/all", authMiddleware, async (req, res) => {
  try {
    if (!["admin", "boss"].includes(req.user.role)) {
      return res.status(403).json({ message: "غير مصرح لك بالوصول للوحة التحكم" });
    }

    const { status, city, type, specialty, search } = req.query;
    let filter = {};

    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;
    if (city) filter["location.city"] = { $regex: city, $options: "i" };
    if (type) filter.entityType = type;
    if (specialty) filter.specialties = { $in: [specialty] };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const entities = await MedicalEntity.find(filter)
      .populate("owner", "name email phone image role")
      .populate("doctors", "name email phone image specialty isActive")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: entities.length,
      data: entities,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/admin/:id/details", authMiddleware, async (req, res) => {
  try {
    if (!["admin", "boss"].includes(req.user.role)) {
      return res.status(403).json({ message: "غير مصرح لك بالوصول" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "معرف المنشأة غير صالح" });
    }

    const entity = await MedicalEntity.findById(req.params.id)
      .populate("owner", "name email phone image role createdAt")
      .populate("doctors", "name email phone image specialty isActive");

    if (!entity) {
      return res.status(404).json({ message: "المنشأة الطبية غير موجودة" });
    }

    return res.status(200).json({
      success: true,
      data: entity,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/admin/:id/toggle-status', async (req, res) => {
  try {
    const entity = await MedicalEntity.findById(req.params.id);
    if (!entity) return res.status(404).json({ success: false, message: 'المنشأة غير موجودة' });

    // تفعيل أو تعطيل
    const newStatus = !entity.isActive;
    
    // إذا تم التفعيل: حدد التاريخ بعد 30 يوماً من الآن، وإذا تم التعطيل اجعله null
    const subscriptionEndDate = newStatus 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
      : null;

    entity.isActive = newStatus;
    entity.subscriptionEndDate = subscriptionEndDate;
    await entity.save();

    res.json({
      success: true,
      isActive: entity.isActive,
      subscriptionEndDate: entity.subscriptionEndDate
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// =====================================================================
// 🌐 4. روتات المنشآت الطبية العامة والمالك (Public & Owner Routes)
// =====================================================================

/**
 * @route   POST /
 * @desc    إنشاء منشأة طبية جديدة + ترقية المالك المختار إلى boss
 * @access  Private (admin / boss)
 */
router.post("/", authMiddleware, upload.single("logo"), async (req, res) => {
  try {
    const parsedData = parseFormDataFields(req.body);
    const { name, entityType, description, specialties, location, phones, workingHours, doctors, owner } = parsedData;

    // 1. التحقق من الحقول الإلزامية الأساسية
    if (!name) {
      return res.status(400).json({ message: "اسم المنشأة الطبية مطلوب" });
    }
    if (!location || !location.city || !location.address) {
      return res.status(400).json({ message: "المدينة والعنوان التفصيلي مطلوبان" });
    }

    const targetOwnerId = owner || req.user.id || req.user._id;

    const existingUser = await User.findById(targetOwnerId);
    if (!existingUser) {
      return res.status(404).json({ message: "المستخدم المختار كمالك غير موجود" });
    }

    const defaultWorkingHours = [
      { day: "الأحد", from: "09:00", to: "17:00", slotDuration: 15, isClosed: false },
      { day: "الإثنين", from: "09:00", to: "17:00", slotDuration: 15, isClosed: false },
      { day: "الثلاثاء", from: "09:00", to: "17:00", slotDuration: 15, isClosed: false },
      { day: "الأربعاء", from: "09:00", to: "17:00", slotDuration: 15, isClosed: false },
      { day: "الخميس", from: "09:00", to: "17:00", slotDuration: 15, isClosed: false },
      { day: "الجمعة", from: "00:00", to: "00:00", slotDuration: 15, isClosed: true },
      { day: "السبت", from: "00:00", to: "00:00", slotDuration: 15, isClosed: true },
    ];

    // تجميع مصفوفة الأطباء
    let doctorsList = doctors || [];
    if (entityType === "private_clinic") {
      // إذا كان المالك نفسه طبيباً نضيفه، وإلا نكتفي بالمصفوفة
      if (!doctorsList.includes(targetOwnerId)) {
        doctorsList.push(targetOwnerId);
      }
    }

    const logoPath = req.file ? req.file.path : undefined;

    const newEntity = new MedicalEntity({
      name,
      entityType,
      description,
      owner: targetOwnerId,
      doctors: doctorsList,
      specialties: specialties || [],
      location,
      phones: phones || [],
      workingHours: workingHours || defaultWorkingHours,
      logo: logoPath,
      subscriptionStatus: "active", // تفعيل مبدئي عند الإنشاء
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 يوماً مجاناً
    });

    await newEntity.save();

    // ترقية المالك إلى boss
    if (existingUser.role !== "admin") {
      await User.findByIdAndUpdate(targetOwnerId, { role: "boss" });
    }

    return res.status(201).json({ 
      message: "تم إنشاء المنشأة الطبية بنجاح وترقية مالكها إلى مدير (boss)", 
      entity: newEntity 
    });

  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(error.errors).map((e) => e.message).join(", "),
      });
    }

    return res.status(500).json({
      message: error.message || "حدث خطأ في الخادم أثناء الإنشاء",
    });
  }
});

// router.get("/", async (req, res) => {
//   try {
//     const { search, city, type } = req.query;
//     let filter = { isActive: true };

//     if (search) filter.$text = { $search: search };
//     if (city) filter["location.city"] = city;
//     if (type) filter.entityType = type;

//     const entities = await MedicalEntity.find(filter)
//       .populate("owner", "name email image")
//       .populate("doctors", "name email image");

//     return res.status(200).json(entities);
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// });
router.get("/", async (req, res) => {
  try {
    const { search, city, type, lat, lng, latitude, longitude } = req.query;

    // تحديد الإحداثيات الممررة
    const userLat = parseFloat(lat || latitude);
    const userLng = parseFloat(lng || longitude);
    const hasCoordinates = !isNaN(userLat) && !isNaN(userLng);

    // 1. في حال توفر الإحداثيات نستخدم التجميع (Aggregation) لمعالجة المسافة والفرز
    if (hasCoordinates) {
      const pipeline = [
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [userLng, userLat] // [Longitude, Latitude]
            },
            distanceField: "distance", // إضافة حقل المسافة بالـ meters لكل عنصر
            spherical: true,
            query: { isActive: true }
          }
        }
      ];

      // تطبيق بقية الفلاتر داخل pipeline البحث
      if (search) {
        pipeline[0].$geoNear.query.$text = { $search: search };
      }
      if (city) {
        pipeline[0].$geoNear.query["location.city"] = city;
      }
      if (type) {
        pipeline[0].$geoNear.query.entityType = type;
      }

      // إحضار بيانات المالك والأطباء المرتبطين
      pipeline.push(
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner"
          }
        },
        { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            "owner.password": 0,
            "owner.token": 0
          }
        }
      );

      const entities = await MedicalEntity.aggregate(pipeline);
      return res.status(200).json(entities);
    }

    // 2. في حال عدم توفر موقع المستخدم نعتمد الاستعلام التقليدي
    let filter = { isActive: true };

    if (search) filter.$text = { $search: search };
    if (city) filter["location.city"] = city;
    if (type) filter.entityType = type;

    const entities = await MedicalEntity.find(filter)
      .populate("owner", "name email image")
      .populate("doctors", "name email image")
      .sort({ createdAt: -1 });

    return res.status(200).json(entities);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "معرف المنشأة غير صالح" });
    }

    const entity = await MedicalEntity.findById(req.params.id)
      .populate("owner", "name email image")
      .populate("doctors", "name email image");

    if (!entity || !entity.isActive) {
      return res.status(404).json({ message: "المنشأة الطبية غير موجودة أو غير نشطة حالياً" });
    }

    return res.status(200).json(entity);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.put("/:id", authMiddleware, upload.single("logo"), async (req, res) => {
  try {
    const entityId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(entityId)) {
      return res.status(400).json({ message: "معرف المنشأة غير صالح" });
    }

    const entity = await MedicalEntity.findById(entityId);
    if (!entity) return res.status(404).json({ message: "المنشأة الطبية غير موجودة" });

    const userId = req.user.id || req.user._id;
    if (entity.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: "غير مصرح لك بتعديل بيانات هذه المنشأة" });
    }

    let updateData = parseFormDataFields(req.body);

    if (req.file) {
      updateData.logo = req.file.path;
    }

    Object.assign(entity, updateData);
    await entity.save();

    return res.status(200).json({ message: "تم تحديث بيانات المنشأة بنجاح", entity });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.put("/:id/working-hours", authMiddleware, async (req, res) => {
  try {
    const { workingHours } = req.body;
    const entityId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(entityId)) {
      return res.status(400).json({ message: "معرف المنشأة غير صالح" });
    }

    if (!workingHours || !Array.isArray(workingHours)) {
      return res.status(400).json({ message: "صيغة أوقات العمل غير صالحة، يجب إرسال مصفوفة كاملة" });
    }

    const entity = await MedicalEntity.findById(entityId);
    if (!entity) return res.status(404).json({ message: "المنشأة الطبية غير موجودة" });

    const userId = req.user.id || req.user._id;
    if (entity.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: "غير مصرح لك بتعديل أوقات العمل لهذه المنشأة" });
    }

    entity.workingHours = workingHours;
    await entity.save();

    return res.status(200).json({ message: "تم تحديث أوقات العمل بنجاح", workingHours: entity.workingHours });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/:id/doctors", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "معرف المنشأة غير صالح" });
    }

    const entity = await MedicalEntity.findById(id).populate({
      path: "doctors",
      // جلب الحقول المتاحة فعلياً في UserSchema فقط
      select: "name email image role",
      // فلترة النتائج للحصول على المستخدمين الذين دورهم doctor فقط
      match: { role: "doctor" }
    });

    if (!entity || !entity.isActive) {
      return res.status(404).json({
        message: "المنشأة الطبية غير موجودة أو غير نشطة حالياً",
      });
    }

    return res.status(200).json({
      entityId: entity._id,
      entityName: entity.name,
      count: entity.doctors.length,
      doctors: entity.doctors,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
/**
 * @route   PATCH /api/medical-entities/:id/toggle-booking
 * @desc    إيقاف أو تفعيل الحجز للمنشأة الطبية بالكامل (للمالك boss أو admin)
 * @access  Private (boss / admin)
 */
router.patch("/medical-entities/:id/toggle-booking", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "معرف المنشأة غير صالح" });
    }

    const entity = await MedicalEntity.findById(id);
    if (!entity) {
      return res.status(404).json({ message: "المنشأة الطبية غير موجودة" });
    }

    const userId = req.user.id || req.user._id;
    const isOwner = entity.owner.toString() === userId.toString();
    const isAdmin = req.user.role === "admin";

    // التأكد من أن المنفذ إما الأدمن أو مالك هذه المنشأة تحديداً
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "غير مصرح لك بالتحكم في حجوزات هذه المنشأة" });
    }

    // عكس حالة الحجز الحالي
    entity.isBookingAllowed = !entity.isBookingAllowed;
    await entity.save();

    return res.status(200).json({
      success: true,
      message: `تم ${entity.isBookingAllowed ? "تفعيل" : "إيقاف"} الحجز للمنشأة بنجاح`,
      isBookingAllowed: entity.isBookingAllowed
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "معرف المنشأة غير صالح" });
    }

    const entity = await MedicalEntity.findById(req.params.id);
    if (!entity) return res.status(404).json({ message: "المنشأة الطبية غير موجودة" });
 const userId = req.user.id || req.user._id;
 const isOwner = entity.owner.toString() === userId.toString();
 const isAdmin = req.user.role === "admin";

if (!isOwner && !isAdmin) {
  return res.status(403).json({ message: "غير مصرح لك بتجميد أو حذف هذه المنشأة" });
}

    entity.isActive = false;
    await entity.save();

    return res.status(200).json({ message: "تم تعطيل المنشأة الطبية بنجاح" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
// =====================================================================
// 📌 إزالة طبيب من المنشأة الطبية بواسطة (المدير / الأدمن)
// =====================================================================
/**
 * @route   DELETE /api/medical-entities/:entityId/doctors/:doctorId
 * @desc    إزالة طبيب من المنشأة الطبية وفك ارتباطه بها
 * @access  Private (Boss / Admin)
 */
router.delete("/:entityId/doctors/:doctorId", authMiddleware, async (req, res) => {
  try {
    const { entityId, doctorId } = req.params;

    // 1. التحقق من صحة المعرفات
    if (!mongoose.Types.ObjectId.isValid(entityId) || !mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "معرف المنشأة أو معرف الطبيب غير صالح" });
    }

    // 2. البحث عن المنشأة الطبية
    const entity = await MedicalEntity.findById(entityId);
    if (!entity) {
      return res.status(404).json({ message: "المنشأة الطبية غير موجودة" });
    }

    // 3. التحقق من الصلاحيات (يجب أن يكون مالك المنشأة boss أو أدمن admin)
    const currentUserId = (req.user.id || req.user._id).toString();
    const isOwner = entity.owner.toString() === currentUserId;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "غير مصرح لك بإزالة أطباء من هذه المنشأة" });
    }

    // 4. إزالة الطبيب من مصفوفة doctors في نموذج المنشأة
    await MedicalEntity.findByIdAndUpdate(entityId, {
      $pull: { doctors: doctorId }
    });

    // 5. حذف ملف تعريف الطبيب Doctor أو تحديث المنشأة الخاصة به
    // (doctorId قد يكون ID المستخدم أو ID بروفايل الطبيب)
    await Doctor.findOneAndDelete({
      $or: [
        { _id: doctorId, medicalEntity: entityId },
        { doctor: doctorId, medicalEntity: entityId }
      ]
    });

    return res.status(200).json({
      success: true,
      message: "تمت إزالة الطبيب وفك ارتباطه بالمنشأة الطبية بنجاح"
    });

  } catch (error) {
    console.error("خطأ في إزالة الطبيب من المنشأة:", error);
    return res.status(500).json({
      message: "حدث خطأ في السيرفر أثناء إزالة الطبيب",
      error: error.message
    });
  }
});
/**
 * @route   PATCH /:id/toggle-booking-status
 * @desc    تحديث حالة الحجز (isBookingAllowed) وتعيين سبب الإيقاف (bookingPauseReason)
 * @access  Private (Boss / Admin)
 */
router.patch("/:id/toggle-booking-status", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { isBookingAllowed, bookingPauseReason, bookingMessage, pauseReason } = req.body;

    // 1. التحقق من صحة ID المنشأة
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "معرف المنشأة غير صالح" });
    }

    // 2. البحث عن المنشأة
    const entity = await MedicalEntity.findById(id);
    if (!entity) {
      return res.status(404).json({ message: "المنشأة الطبية غير موجودة" });
    }

    // 3. التحقق من الصلاحية: المالك (Boss) أو الأدمن (Admin)
    const currentUserId = (req.user.id || req.user._id).toString();
    const isOwner = entity.owner.toString() === currentUserId;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        message: "غير مصرح لك بالتحكم في حالة حجز هذه المنشأة (صلاحية Boss فقط)" 
      });
    }

    // 4. تحديد الحالة الجديدة (Boolean)
    const newBookingState = typeof isBookingAllowed === "boolean" 
      ? isBookingAllowed 
      : !entity.isBookingAllowed;

    // 5. استخراج السبب بأي مسمى مُرسل من الفرونت إند
    const reasonText = bookingPauseReason || bookingMessage || pauseReason;

    // 6. تطبيق التغييرات على الموديل
    entity.isBookingAllowed = newBookingState;

    if (!newBookingState) {
      // عند الإيقاف: حفظ السبب المرسل أو النص الافتراضي
      entity.bookingPauseReason = (reasonText && reasonText.trim() !== "")
        ? reasonText.trim()
        : "الحجز متوقف مؤقتاً في هذه المنشأة بناءً على طلب الإدارة.";
    } else {
      // عند إعادة التفعيل: إرجاع السبب إلى فارغ "" كما هو محدد بالـ Schema
      entity.bookingPauseReason = "";
    }

    // 7. حفظ التغييرات في قاعدة البيانات
    await entity.save();

    return res.status(200).json({
      success: true,
      message: `تم ${newBookingState ? "تفعيل" : "إيقاف"} الحجز بنجاح`,
      data: {
        entityId: entity._id,
        isBookingAllowed: entity.isBookingAllowed,
        bookingPauseReason: entity.bookingPauseReason
      }
    });

  } catch (error) {
    console.error("❌ Error in /toggle-booking-status:", error);
    return res.status(500).json({ 
      message: "حدث خطأ في السيرفر أثناء تحديث حالة الحجز", 
      error: error.message 
    });
  }
});
// =====================================================================
// 💳 روتات إدارة الاشتراكات والتوقيت التنازلي (Admin Only)
// =====================================================================

/**
 * @route   PATCH /admin/:id/subscription
 * @desc    تفعيل أو تمديد أو إيقاف اشتراك المنشأة (30 يوماً)
 * @access  Private (admin / boss)
 */
router.patch("/admin/:id/subscription", authMiddleware, async (req, res) => {
  try {
    if (!["admin", "boss"].includes(req.user.role)) {
      return res.status(403).json({ message: "غير مصرح لك بإدارة الاشتراكات" });
    }

    const { id } = req.params;
    const { action, daysToAdd = 30 } = req.body; // action: 'activate' | 'cancel'

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "معرف المنشأة غير صالح" });
    }

    const entity = await MedicalEntity.findById(id);
    if (!entity) {
      return res.status(404).json({ message: "المنشأة الطبية غير موجودة" });
    }

    if (action === "cancel") {
      entity.subscriptionEndDate = null;
      entity.subscriptionStatus = "expired";
      entity.isActive = false; // تعطيل المنشأة عند إلغاء الاشتراك تلقائياً
      await entity.save();

      return res.status(200).json({
        success: true,
        message: "تم إلغاء الاشتراك وتعطيل المنشأة",
        subscriptionStatus: entity.subscriptionStatus,
      });
    }

    // تفعيل / تجديد الاشتراك 30 يوم ابتداءً من الآن (أو تمديده إن كان فعالاً)
    const now = new Date();
    let startDate = now;

    // إذا كان الاشتراك فعالاً مسبقاً ولم ينتهِ بعد، نمدد فوق التاريخ القديم
    if (entity.subscriptionEndDate && entity.subscriptionEndDate > now) {
      startDate = new Date(entity.subscriptionEndDate);
    }

    const endDate = new Date(startDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    entity.subscriptionEndDate = endDate;
    entity.subscriptionStatus = "active";
    entity.isActive = true; // تفعيل المنشأة تلقائياً عند تفعيل الاشتراك

    await entity.save();

    return res.status(200).json({
      success: true,
      message: `تم تفعيل الاشتراك بنجاح لمدة ${daysToAdd} يوماً`,
      subscriptionEndDate: entity.subscriptionEndDate,
      subscriptionStatus: entity.subscriptionStatus,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
// =====================================================================
// 📍 5. روت جلب المجمعات الطبية الأقرب لموقع المريض الجغرافي
// =====================================================================
/**
 * @route   GET /api/medical-entities/nearby
 * @desc    جلب المجمعات الطبية الأقرب للمريض بناءً على خط العرض وخط الطول
 * @access  Public
 */
router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng, maxDistance = 10000, limit = 20 } = req.query; 
    // maxDistance بالمتر (مثلاً 10000m = 10 كيلومتر افتراضياً)

    if (!lat || !lng) {
      return res.status(400).json({ 
        message: "يرجى تزويد خط العرض (lat) وخط الطول (lng) لتحديد موقعك" 
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({ message: "قيم الإحداثيات غير صالحة" });
    }

    // الاستعلام باستخدام $near في GeoJSON
    const nearbyEntities = await MedicalEntity.find({
      isActive: true,
      "location.coordinates": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [userLng, userLat] // ⚠️ الترتيب دائماً: Longitude ثم Latitude
          },
          $maxDistance: parseInt(maxDistance) // أقصى مسافة للبحث بالمتر
        }
      }
    })
    .limit(parseInt(limit))
    .populate("owner", "name email image")
    .populate("doctors", "name email image");

    return res.status(200).json({
      success: true,
      count: nearbyEntities.length,
      data: nearbyEntities
    });

  } catch (error) {
    console.error("❌ Error in fetching nearby entities:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /admin/:id/subscription-countdown
 * @desc    حساب المتبقي من الـ 30 يوم للتوقيت التنازلي (بالأيام والساعات والدقائق)
 * @access  Private (admin / boss)
 */
router.get("/admin/:id/subscription-countdown", authMiddleware, async (req, res) => {
  try {
    if (!["admin", "boss"].includes(req.user.role)) {
      return res.status(403).json({ message: "غير مصرح لك بالوصول" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "معرف المنشأة غير صالح" });
    }

    const entity = await MedicalEntity.findById(id).select("name subscriptionEndDate subscriptionStatus isActive");
    if (!entity) {
      return res.status(404).json({ message: "المنشأة غير موجودة" });
    }

    if (!entity.subscriptionEndDate || entity.subscriptionStatus === "expired") {
      return res.status(200).json({
        success: true,
        isExpired: true,
        message: "الاشتراك غير فعال أو منتهي",
        countdown: { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 }
      });
    }

    const now = new Date();
    const diffMs = new Date(entity.subscriptionEndDate) - now;

    // إذا انتهى الوقت فعلياً
    if (diffMs <= 0) {
      entity.subscriptionStatus = "expired";
      entity.isActive = false;
      await entity.save();

      return res.status(200).json({
        success: true,
        isExpired: true,
        message: "انتهى اشتراك هذه المنشأة",
        countdown: { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 }
      });
    }

    // حساب تفاصيل الوقت التنازلي
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return res.status(200).json({
      success: true,
      isExpired: false,
      subscriptionEndDate: entity.subscriptionEndDate,
      countdown: {
        days,
        hours,
        minutes,
        seconds,
        totalMs: diffMs
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
router.patch("/admin/:id/toggle-status", authMiddleware, async (req, res) => {
  try {
    if (!["admin", "boss"].includes(req.user.role)) {
      return res.status(403).json({ message: "غير مصرح لك بتغيير حالة المنشآت" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "معرف المنشأة غير صالح" });
    }

    const entity = await MedicalEntity.findById(req.params.id);
    if (!entity) {
      return res.status(404).json({ message: "المنشأة الطبية غير موجودة" });
    }

    entity.isActive = !entity.isActive;

    // 🌟 تفعيل العداد التنازلي 30 يوم عند التفعيل لأول مرة أو تجديده
    if (entity.isActive) {
      const now = new Date();
      entity.subscriptionEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      entity.subscriptionStatus = "active";
    } else {
      entity.subscriptionStatus = "expired";
    }

    await entity.save();

    return res.status(200).json({
      success: true,
      message: `تم ${entity.isActive ? "تفعيل المنشأة وبدء اشتراك 30 يوم" : "تعطيل المنشأة"} بنجاح`,
      isActive: entity.isActive,
      subscriptionEndDate: entity.subscriptionEndDate
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
module.exports = router;