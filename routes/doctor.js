
// //doc@g.com
// //xx@xx.com
const express = require("express");
const mongoose = require("mongoose");
const auth = require("../auth/jwt");
const router = express.Router();

const User = require("../model/UserSchema");
const Doctor = require("../model/DoctorSchema");
const MedicalEntity = require("../model/MedicalcomplexSchema");

// دالة لتنظيف النص وتجريده من العبارات الشائعة والهمزات والأخطاء الإملائية
function normalizeAndCleanSearch(query) {
  if (!query) return "";

  let cleaned = query.trim();

  // 1. إزالة الألقاب والبادئات الشائعة التي يكتبها المستخدمون
  cleaned = cleaned.replace(/^(د\.?|د\/|دكتور|الدكتور|عيادة|العيادة|مجمع|المجمع|مركز|المركز|مستشفى|المستشفى)\s*/gi, "");

  // 2. إزالة الكلمات الزائدة في منتصف أو نهاية النص
  cleaned = cleaned.replace(/\b(عيادة|مجمع|مركز|مستشفى|دكتور)\b/gi, "");

  // 3. توحيد الهمزات والألف والتاء المربوطة لمعالجة الأخطاء الإملائية الشائعة
  cleaned = cleaned
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u0652]/g, ""); // إزالة التشكيل

  return cleaned.trim();
}

// دالة لبناء التعبير النمطي (RegExp) ليكون مرناً مع الأخطاء
function buildFlexibleRegex(term) {
  const normalized = normalizeAndCleanSearch(term);
  if (!normalized) return new RegExp(term, "i");

  // تحويل كل حرف إلى مجموعة خيارات محتملة للأخطاء الإملائية
  let regexPattern = "";
  for (let char of normalized) {
    if (char === "ا") regexPattern += "[اأإآٱ]";
    else if (char === "ه" || char === "ة") regexPattern += "[هة]";
    else if (char === "ي" || char === "ى") regexPattern += "[يى]";
    else regexPattern += char;
  }

  return new RegExp(regexPattern, "i");
}

// =====================================================================
// 📌 0. جلب المنشأة الطبية التي يديرها المستخدم الحالي (الـ Boss)
// =====================================================================
router.get("/my-entity", auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const myEntity = await MedicalEntity.findOne({ owner: userId })
      .populate("owner", "username name email role")
      .populate({
        path: "doctors",
        select: "username name email image role"
      });

    if (!myEntity) {
      return res.status(404).json({ message: "لم يتم العثور على منشأة طبية مرتبطة بحسابك" });
    }

    return res.status(200).json({ message: "True", entity: myEntity });
  } catch (error) {
    console.error("خطأ في جلب بيانات المنشأة:", error);
    return res.status(500).json({ message: "خطأ في السيرفر", error: error.message });
  }
});

// =====================================================================
// 📌 جلب إحصائيات الطبيب العامة (تشمل الحجوزات الفائتة/عدم الحضور)
// =====================================================================
router.get("/doctor/statistics", auth, async (req, res) => {
  try {
    const currentUserId = (req.user.id || req.user._id).toString();

    const doctorProfile = await Doctor.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(currentUserId) ? currentUserId : null },
        { doctor: currentUserId }
      ]
    });

    if (!doctorProfile) {
      return res.status(404).json({ message: "لم يتم العثور على ملف الطبيب" });
    }

    const { filterType, status, startDate, endDate } = req.query;
    const AppointmentModel = mongoose.model("Appointment") || mongoose.model("Slot");

    const doctorIds = [doctorProfile._id, doctorProfile.doctor, currentUserId].filter(Boolean);
    
    let baseQuery = { doctor: { $in: doctorIds } };
    if (status && status !== "all") baseQuery.status = status;

    const now = new Date();
    let dateStart, dateEnd;

    if (filterType === "today") {
      dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      dateEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (filterType === "week") {
      const startOfWeek = new Date(now);
      const currentDay = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - currentDay);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      dateStart = startOfWeek; dateEnd = endOfWeek;
    } else if (filterType === "month") {
      dateStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (filterType === "year") {
      dateStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      dateEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (filterType === "custom" && startDate && endDate) {
      dateStart = new Date(startDate); dateStart.setHours(0, 0, 0, 0);
      dateEnd = new Date(endDate); dateEnd.setHours(23, 59, 59, 999);
    }

    if (filterType && filterType !== "all" && dateStart && dateEnd) {
      baseQuery.slot = { $gte: dateStart, $lte: dateEnd };
    }

    const appointments = await AppointmentModel.find(baseQuery).sort({ slot: 1 });

    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === "completed").length;
    const pendingAppointments = appointments.filter(a => a.status === "pending" || !a.status).length;
    const cancelledAppointments = appointments.filter(a => a.status === "cancelled").length;
    const missedAppointments = appointments.filter(a => a.status === "no_show").length;
    
    const attendanceRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;

    const daysOrder = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const daysMap = {};
    daysOrder.forEach(day => daysMap[day] = { name: day, appointments: 0, completed: 0, missed: 0 });

    appointments.forEach(app => {
      if (app.slot) {
        const dateObj = new Date(app.slot);
        if (!isNaN(dateObj.getTime())) {
          const dayName = daysOrder[dateObj.getDay()];
          if (daysMap[dayName]) {
            daysMap[dayName].appointments += 1;
            if (app.status === "completed") daysMap[dayName].completed += 1;
            if (app.status === "no_show") daysMap[dayName].missed += 1;
          }
        }
      }
    });

    const chartData = Object.values(daysMap);
    const statusDistribution = [
      { name: "مكتملة", value: completedAppointments, color: "#10b981" },
      { name: "قيد الانتظار", value: pendingAppointments, color: "#f59e0b" },
      { name: "ملغاة", value: cancelledAppointments, color: "#ef4444" },
      { name: "فائتة (لم يحضر)", value: missedAppointments, color: "#6b7280" }
    ];

    return res.status(200).json({
      success: true,
      stats: { 
        totalAppointments, 
        completedAppointments, 
        pendingAppointments, 
        cancelledAppointments, 
        missedAppointments, 
        attendanceRate, 
        chartData, 
        statusDistribution 
      }
    });

  } catch (error) {
    return res.status(500).json({ message: "خطأ في السيرفر", error: error.message });
  }
});

// =====================================================================
// 📌 1. إنشاء طبيب جديد (خاص بالأدمن والـ Boss فقط) - تم إضافة socialMedia
// =====================================================================
router.post("/Doctor", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "boss") {
      return res.status(403).json({ message: "خطأ في الصلاحية، يجب أن تكون أدمن أو مدير" });
    }

    const { doctor, medicalEntity, specialty, experience, description, workingDays, workingHours, socialMedia } = req.body;

    if (!doctor || !medicalEntity || !specialty || experience === undefined || !description) {
      return res.status(400).json({ message: "جميع الحقول الأساسية مطلوبة" });
    }

    const entity = await MedicalEntity.findById(medicalEntity);
    if (!entity) {
      return res.status(404).json({ message: "المنشأة الطبية المحددة غير موجودة" });
    }

    const newDoc = new Doctor({
      doctor,
      medicalEntity,
      specialty,
      experience,
      description,
      workingDays: workingDays || [],
      workingHours: workingHours || undefined,
      socialMedia: socialMedia || {}
    });
    await newDoc.save();

    await MedicalEntity.findByIdAndUpdate(medicalEntity, {
      $addToSet: { doctors: doctor }
    });

    await User.findByIdAndUpdate(doctor, { role: "doctor" });

    return res.status(201).json({ 
      message: "تم إنشاء ملف تعريف الطبيب وترقية الحساب وربطه بالمنشأة بنجاح! :)", 
      data: newDoc 
    });

  } catch (error) {
    console.error("خطأ في الخادم أثناء إضافة الطبيب:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "هذا المستخدم يملك بالفعل ملف تعريف طبيب مسجل" });
    }
    return res.status(500).json({ message: "خطأ في السيرفر", error: error.message });
  }
});

// =====================================================================
// 📌 2. البحث عن الأطباء
// =====================================================================
router.get("/search", async (req, res) => {
  try {
    const { search } = req.query;
    let doctorFilter = {};

    if (search && search.trim() !== "") {
      const cleanSearch = search.trim().replace(/^(د\.?|د\/|دكتور|الدكتور)\s*/i, "");
      const searchRegex = new RegExp(cleanSearch, "i");
      const matchingUsers = await User.find({ $or: [{ username: searchRegex }, { name: searchRegex }] }).select("_id");
      const userIds = matchingUsers.map((user) => user._id);
      doctorFilter = { $or: [{ doctor: { $in: userIds } }, { specialty: searchRegex }] };
    }

    const doctors = await Doctor.find(doctorFilter)
      .populate("doctor", "username name email image role")
      .populate("medicalEntity", "name location contactInfo entityType");

    return res.status(200).json({ message: "True", count: doctors.length, doctors });
  } catch (error) {
    return res.status(500).json({ message: "خطأ في السيرفر", error: error.message });
  }
});
router.get("/global-search", async (req, res) => {
  try {
    const { search, city, specialty } = req.query;
    
    let doctorFilter = {};
    let entityFilter = { isActive: true };

    // 1. الفلترة المباشرة بحسب المحافظة (المدينة) والتخصص
    if (city && city.trim() !== "") {
      entityFilter["location.city"] = new RegExp(`^${city.trim()}$`, "i");
    }

    if (specialty && specialty.trim() !== "") {
      doctorFilter.specialty = new RegExp(specialty.trim(), "i");
    }

    // 2. معالجة البحث النصي العام (Query Search)
    if (search && search.trim() !== "") {
      const flexibleRegex = buildFlexibleRegex(search);
      const rawRegex = new RegExp(search.trim(), "i");

      const matchingUsers = await User.find({
        $or: [
          { username: flexibleRegex }, 
          { name: flexibleRegex },
          { username: rawRegex },
          { name: rawRegex }
        ]
      }).select("_id");
      
      const userIds = matchingUsers.map((u) => u._id);

      const searchConditions = [
        { doctor: { $in: userIds } },
        { specialty: flexibleRegex }
      ];

      if (doctorFilter.specialty) {
        doctorFilter = { $and: [{ specialty: doctorFilter.specialty }, { $or: searchConditions }] };
      } else {
        doctorFilter = { $or: searchConditions };
      }

      const entitySearchConditions = [
        { name: flexibleRegex },
        { name: rawRegex },
        { specialties: flexibleRegex },
        { entityType: rawRegex },
        { "location.city": flexibleRegex },
        { "location.address": flexibleRegex }
      ];

      if (entityFilter["location.city"]) {
        entityFilter = { $and: [{ "location.city": entityFilter["location.city"] }, { $or: entitySearchConditions }] };
      } else {
        entityFilter.$or = entitySearchConditions;
      }
    }

    // جلب البيانات الأولية
    let [doctors, entities] = await Promise.all([
      Doctor.find(doctorFilter)
        .populate("doctor", "username name email image role")
        .populate("medicalEntity", "name location contactInfo entityType"),
      MedicalEntity.find(entityFilter)
        .populate("owner", "name email image")
        .select("name entityType logo description specialties location phones isBookingAllowed")
    ]);

    // 3. جلب أطباء المنشآت الطبية المطابقة وإضافتهم لنتائج الأطباء
    if (entities.length > 0) {
      const matchedEntityIds = entities.map(e => e._id);
      
      let entityDoctorsQuery = { medicalEntity: { $in: matchedEntityIds } };
      if (specialty && specialty.trim() !== "") {
        entityDoctorsQuery.specialty = new RegExp(specialty.trim(), "i");
      }

      const additionalDoctors = await Doctor.find(entityDoctorsQuery)
        .populate("doctor", "username name email image role")
        .populate("medicalEntity", "name location contactInfo entityType");

      // دمج الأطباء وتفادي التكرار باستخدام _id
      const doctorMap = new Map();
      doctors.forEach(d => doctorMap.set(d._id.toString(), d));
      additionalDoctors.forEach(d => doctorMap.set(d._id.toString(), d));

      doctors = Array.from(doctorMap.values());
    }

    // 4. فلترة إضافية للأطباء بحسب المدينة في حال اختيار محافظة مسبقاً
    if (city && city.trim() !== "") {
      doctors = doctors.filter(doc => 
        doc.medicalEntity && 
        doc.medicalEntity.location && 
        doc.medicalEntity.location.city &&
        doc.medicalEntity.location.city.toLowerCase() === city.trim().toLowerCase()
      );
    }

    return res.status(200).json({
      success: true,
      totalCount: doctors.length + entities.length,
      doctors,
      entities
    });
  } catch (error) {
    console.error("خطأ في البحث الموحد:", error);
    return res.status(500).json({ success: false, message: "خطأ في السيرفر", error: error.message });
  }
});
// router.get("/global-search", async (req, res) => {
//   try {
//     const { search } = req.query;
    
//     let doctorFilter = {};
//     let entityFilter = { isActive: true };

//     if (search && search.trim() !== "") {
//       const flexibleRegex = buildFlexibleRegex(search);
//       const rawRegex = new RegExp(search.trim(), "i");

//       const matchingUsers = await User.find({
//         $or: [
//           { username: flexibleRegex }, 
//           { name: flexibleRegex },
//           { username: rawRegex },
//           { name: rawRegex }
//         ]
//       }).select("_id");
      
//       const userIds = matchingUsers.map((u) => u._id);

//       doctorFilter = {
//         $or: [
//           { doctor: { $in: userIds } },
//           { specialty: flexibleRegex }
//         ]
//       };

//       entityFilter.$or = [
//         { name: flexibleRegex },
//         { name: rawRegex },
//         { specialties: flexibleRegex },
//         { entityType: rawRegex },
//         { "location.city": flexibleRegex },
//         { "location.address": flexibleRegex }
//       ];
//     }

//     const [doctors, entities] = await Promise.all([
//       Doctor.find(doctorFilter)
//         .populate("doctor", "username name email image role")
//         .populate("medicalEntity", "name location contactInfo entityType"),
//       MedicalEntity.find(entityFilter)
//         .populate("owner", "name email image")
//         .select("name entityType logo description specialties location phones isBookingAllowed")
//     ]);

//     return res.status(200).json({
//       success: true,
//       totalCount: doctors.length + entities.length,
//       doctors,
//       entities
//     });
//   } catch (error) {
//     console.error("خطأ في البحث الموحد:", error);
//     return res.status(500).json({ success: false, message: "خطأ في السيرفر", error: error.message });
//   }
// });

// =====================================================================
// 📌 3. جلب جميع الأطباء
// =====================================================================
router.get("/Doctors", async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate("doctor", "username name email image role")
      .populate("medicalEntity", "name location contactInfo entityType");
    return res.status(200).json({ message: "True", doctors });
  } catch (error) {
    return res.status(500).json({ message: "خطأ في السيرفر", error: error.message });
  }
});

// =====================================================================
// 📌 4. جلب تفاصيل طبيب واحد
// =====================================================================
router.get("/Doctors/:id", async (req, res) => {
  try {
    const doctorId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "معرف الطبيب غير صالح" });
    }

    let doctor = await Doctor.findOne({ $or: [{ _id: doctorId }, { doctor: doctorId }] })
      .populate("doctor", "username name email image role")
      .populate("medicalEntity", "name location contactInfo entityType");

    if (!doctor) return res.status(404).json({ message: "False", error: "لم يتم العثور على الطبيب" });
    return res.status(200).json({ message: "True", doctor });
  } catch (error) {
    return res.status(500).json({ message: "خطأ في السيرفر", error: error.message });
  }
});

// ==========================================
// 📌 4.5 جلب جدول عمل الطبيب
// ==========================================
router.get("/doctors/:id/schedule", auth, async (req, res) => {
  try {
    const doctorId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "معرف الطبيب غير صالح" });
    }

    const doctor = await Doctor.findOne({ $or: [{ _id: doctorId }, { doctor: doctorId }] }).populate("medicalEntity");
    if (!doctor) return res.status(404).json({ message: "ملف الطبيب غير موجود" });

    const currentUserId = (req.user.id || req.user._id).toString();
    const isAdmin = req.user.role === "admin";
    const isDoctorHimself = doctor.doctor.toString() === currentUserId;
    const isOwner = doctor.medicalEntity && doctor.medicalEntity.owner && doctor.medicalEntity.owner.toString() === currentUserId;

    if (!isAdmin && !isDoctorHimself && !isOwner) {
      return res.status(403).json({ message: "غير مصرح لك بالاطلاع على جدول هذا الطبيب" });
    }

    return res.status(200).json({
      success: true,
      workingDays: doctor.workingDays || [],
      workingHours: doctor.workingHours || { openTime: "09:00", closeTime: "17:00", slotDuration: 15 },
      unavailableDates: doctor.unavailableDates || [],
      isBookingAllowed: doctor.isBookingAllowed
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 📌 4.6 تحديث جدول عمل الطبيب
// ==========================================
router.put("/doctors/:id/schedule", auth, async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { workingDays, workingHours } = req.body;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "معرف الطبيب غير صالح" });
    }

    const doctor = await Doctor.findOne({ $or: [{ _id: doctorId }, { doctor: doctorId }] }).populate("medicalEntity");
    if (!doctor) return res.status(404).json({ message: "ملف الطبيب غير موجود" });

    const currentUserId = (req.user.id || req.user._id).toString();
    const isAdmin = req.user.role === "admin";
    const isDoctorHimself = doctor.doctor.toString() === currentUserId;
    const isOwner = doctor.medicalEntity && doctor.medicalEntity.owner && doctor.medicalEntity.owner.toString() === currentUserId;

    if (!isAdmin && !isDoctorHimself && !isOwner) {
      return res.status(403).json({ message: "غير مصرح لك بتعديل جدول هذا الطبيب" });
    }

    if (Array.isArray(workingDays)) {
      const validDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const invalidDay = workingDays.find(d => !validDays.includes(d.day));
      if (invalidDay) {
        return res.status(400).json({ message: `اليوم "${invalidDay.day}" غير صالح` });
      }
      doctor.workingDays = workingDays;
    }

    if (workingHours && typeof workingHours === 'object') {
      doctor.workingHours = {
        openTime: workingHours.openTime || doctor.workingHours?.openTime || "09:00",
        closeTime: workingHours.closeTime || doctor.workingHours?.closeTime || "17:00",
        slotDuration: Number(workingHours.slotDuration) || doctor.workingHours?.slotDuration || 15
      };
    }

    await doctor.save();

    return res.status(200).json({
      success: true,
      message: "تم تحديث جدول عمل الطبيب بنجاح",
      workingDays: doctor.workingDays,
      workingHours: doctor.workingHours
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// =====================================================================
// 📌 4.7 إدارة التواريخ المغلقة للطبيب
// =====================================================================
router.patch("/doctors/:id/unavailable-dates", auth, async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { date, reason, action } = req.body;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) return res.status(400).json({ message: "معرف الطبيب غير صالح" });
    if (!date) return res.status(400).json({ message: "يجب تحديد التاريخ" });

    const doctor = await Doctor.findOne({ $or: [{ _id: doctorId }, { doctor: doctorId }] }).populate("medicalEntity");
    if (!doctor) return res.status(404).json({ message: "ملف الطبيب غير موجود" });

    const currentUserId = (req.user.id || req.user._id).toString();
    const isAdmin = req.user.role === "admin";
    const isOwner = doctor.medicalEntity && doctor.medicalEntity.owner && doctor.medicalEntity.owner.toString() === currentUserId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "غير مصرح لك بإدارة تواريخ إغلاق هذا الطبيب" });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    if (action === 'remove') {
      doctor.unavailableDates = doctor.unavailableDates.filter(
        d => new Date(d.date).setHours(0,0,0,0) !== targetDate.getTime()
      );
      await doctor.save();
      return res.status(200).json({ success: true, message: "تم فتح الحجز", unavailableDates: doctor.unavailableDates });
    }

    const alreadyExists = doctor.unavailableDates.some(
      d => new Date(d.date).setHours(0,0,0,0) === targetDate.getTime()
    );

    if (alreadyExists) return res.status(400).json({ message: "هذا التاريخ مغلق بالفعل" });

    doctor.unavailableDates.push({ date: targetDate, reason: reason || 'إجازة استثنائية', createdBy: currentUserId });
    await doctor.save();

    return res.status(200).json({ success: true, message: "تم إغلاق الحجز", unavailableDates: doctor.unavailableDates });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// =====================================================================
// 📌 4.8 إضافة وتحديث وسائل التواصل الاجتماعي للطبيب (جديد)
// =====================================================================
router.patch("/doctors/:id/social-media", auth, async (req, res) => {
  try {
    const doctorId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "معرف الطبيب غير صالح" });
    }

    const doctor = await Doctor.findOne({ $or: [{ _id: doctorId }, { doctor: doctorId }] }).populate("medicalEntity");
    if (!doctor) return res.status(404).json({ message: "ملف الطبيب غير موجود" });

    const currentUserId = (req.user.id || req.user._id).toString();
    const isAdmin = req.user.role === "admin";
    const isDoctorHimself = doctor.doctor.toString() === currentUserId;
    const isOwner = doctor.medicalEntity && doctor.medicalEntity.owner && doctor.medicalEntity.owner.toString() === currentUserId;

    if (!isAdmin && !isDoctorHimself && !isOwner) {
      return res.status(403).json({ message: "غير مصرح لك بتحديث وسائل التواصل هذا الطبيب" });
    }

    const { facebook, instagram, whatsapp, phone, linkedin } = req.body;

    // دمج وسائل التواصل الجديدة مع الموجودة مسبقاً
    doctor.socialMedia = {
      facebook: facebook !== undefined ? facebook : doctor.socialMedia?.facebook || "",
      instagram: instagram !== undefined ? instagram : doctor.socialMedia?.instagram || "",
      whatsapp: whatsapp !== undefined ? whatsapp : doctor.socialMedia?.whatsapp || "",
      phone: phone !== undefined ? phone : doctor.socialMedia?.phone || "",
      linkedin: linkedin !== undefined ? linkedin : doctor.socialMedia?.linkedin || ""
    };

    await doctor.save();

    return res.status(200).json({
      success: true,
      message: "تم تحديث وسائل التواصل الاجتماعي بنجاح",
      socialMedia: doctor.socialMedia
    });
  } catch (error) {
    return res.status(500).json({ message: "خطأ في السيرفر", error: error.message });
  }
});

// =====================================================================
// 📌 5. إيقاف/تفعيل الحجز لطبيب معين
// =====================================================================
router.patch("/doctors/:id/toggle-booking", auth, async (req, res) => {
  try {
    const doctorId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(doctorId)) return res.status(400).json({ message: "معرف الطبيب غير صالح" });

    const doctor = await Doctor.findOne({ $or: [{ _id: doctorId }, { doctor: doctorId }] }).populate("medicalEntity");
    if (!doctor) return res.status(404).json({ message: "ملف الطبيب غير موجود" });

    const userId = req.user.id || req.user._id;
    const isAdmin = req.user.role === "admin";
    const isOwner = doctor.medicalEntity && doctor.medicalEntity.owner && doctor.medicalEntity.owner.toString() === userId.toString();

    if (!isOwner && !isAdmin) return res.status(403).json({ message: "غير مصرح" });

    doctor.isBookingAllowed = !doctor.isBookingAllowed;
    await doctor.save();

    return res.status(200).json({ success: true, message: "تم التغيير بنجاح", isBookingAllowed: doctor.isBookingAllowed });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// =====================================================================
// 📌 جلب جميع حجوزات طبيب معين بالتفصيل
// =====================================================================
router.get("/doctor/:doctorId/appointments", auth, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, status, search, page = 1, limit = 20 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) return res.status(400).json({ message: "معرف غير صالح" });

    const doctorProfile = await Doctor.findOne({ $or: [{ _id: doctorId }, { doctor: doctorId }] }).populate("medicalEntity");
    if (!doctorProfile) return res.status(404).json({ message: "غير موجود" });

    const currentUserId = (req.user.id || req.user._id).toString();
    const isAdmin = req.user.role === "admin";
    const isDoctorHimself = doctorProfile.doctor.toString() === currentUserId;
    const isOwner = doctorProfile.medicalEntity && doctorProfile.medicalEntity.owner && doctorProfile.medicalEntity.owner.toString() === currentUserId;

    if (!isAdmin && !isDoctorHimself && !isOwner) return res.status(403).json({ message: "غير مصرح" });

    const filter = { $or: [{ doctor: doctorProfile._id }, { doctor: doctorProfile.doctor }] };
    if (status) filter.status = status;
    if (date) {
      const searchDate = new Date(date);
      filter.appointmentDate = {
        $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
        $lte: new Date(searchDate.setHours(23, 59, 59, 999))
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const AppointmentModel = mongoose.model("Appointment") || mongoose.model("Slot");

    const appointments = await AppointmentModel.find(filter)
      .populate("user", "name username email phone image")
      .populate("medicalEntity", "name location contactInfo")
      .sort({ appointmentDate: 1, slotTime: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    let filteredAppointments = appointments;
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      filteredAppointments = appointments.filter(item => {
        const patientName = item.user?.name || item.user?.username || "";
        const patientPhone = item.user?.phone || "";
        return searchRegex.test(patientName) || searchRegex.test(patientPhone);
      });
    }

    const totalAppointments = await AppointmentModel.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: filteredAppointments.length,
      totalCount: totalAppointments,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalAppointments / parseInt(limit)),
      doctor: { id: doctorProfile._id, specialty: doctorProfile.specialty, isBookingAllowed: doctorProfile.isBookingAllowed },
      appointments: filteredAppointments
    });
  } catch (error) {
    return res.status(500).json({ message: "خطأ", error: error.message });
  }
});

// =====================================================================
// 📌 6. حذف طبيب
// =====================================================================
router.delete("/Doctors/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "boss") {
      return res.status(403).json({ message: "غير مصرح لك بحذف ملفات الأطباء" });
    }

    const doctorId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "معرف غير صالح" });
    }

    const deletedDoctor = await Doctor.findOneAndDelete({ $or: [{ _id: doctorId }, { doctor: doctorId }] });

    if (!deletedDoctor) return res.status(404).json({ message: "False", error: "الطبيب غير موجود بالفعل" });

    if (deletedDoctor.medicalEntity) {
      await MedicalEntity.findByIdAndUpdate(deletedDoctor.medicalEntity, {
        $pull: { doctors: deletedDoctor.doctor }
      });
    }

    return res.status(200).json({ message: "True", deletedDoctor });
  } catch (error) {
    return res.status(500).json({ message: "خطأ في السيرفر", error: error.message });
  }
});

module.exports = router;