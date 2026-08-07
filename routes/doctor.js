const express = require("express");
const mongoose = require("mongoose"); // إضافة mongoose لتفادي الخطأ في التحقق من ID
const auth = require("../auth/jwt");
const router = express.Router();

const User = require("../model/UserSchema");
const Doctor = require("../model/DoctorSchema");
const MedicalEntity = require("../model/MedicalcomplexSchema");

// =====================================================================
// 📌 0. جلب المنشأة الطبية التي يديرها المستخدم الحالي (الـ Boss)
// =====================================================================
router.get("/my-entity", auth, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    // البحث عن المنشأة التي يكون صاحبها هو المستخدم الحالي
    const myEntity = await MedicalEntity.findOne({ owner: userId })
      .populate("owner", "username name email role")
      .populate({
        path: "doctors",
        select: "username name email image role"
      });

    if (!myEntity) {
      return res.status(404).json({
        message: "لم يتم العثور على منشأة طبية مرتبطة بحسابك"
      });
    }

    return res.status(200).json({
      message: "True",
      entity: myEntity
    });

  } catch (error) {
    console.error("خطأ في جلب بيانات المنشأة:", error);
    return res.status(500).json({
      message: "خطأ في السيرفر أثناء جلب بيانات المنشأة الخاصة بك",
      error: error.message
    });
  }
});
// =====================================================================
// 📌 جلب إحصائيات الطبيب العامة (Statistics Dashboard) - بناءً على حقل slot
// =====================================================================
router.get("/doctor/statistics", auth, async (req, res) => {
  try {
    const currentUserId = (req.user.id || req.user._id).toString();

    // 1. جلب ملف الطبيب
    const doctorProfile = await Doctor.findOne({
      $or: [{ _id: currentUserId }, { doctor: currentUserId }]
    });

    if (!doctorProfile) {
      return res.status(404).json({ message: "لم يتم العثور على ملف الطبيب" });
    }

    const { filterType, status, startDate, endDate } = req.query;
    const AppointmentModel = mongoose.model("Appointment") || mongoose.model("Slot");

    // 2. بناء الاستعلام الأساسي (معرفات الطبيب + حالة الحجز)
    const doctorIds = [doctorProfile._id, doctorProfile.doctor, currentUserId].filter(Boolean);
    
    let baseQuery = {
      doctor: { $in: doctorIds }
    };

    if (status && status !== "all") {
      baseQuery.status = status;
    }

    // 3. تحديد نطاق التواريخ
    const now = new Date();
    let dateStart, dateEnd;

    if (filterType === "today") {
      dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      dateEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } 
    else if (filterType === "week") {
      const startOfWeek = new Date(now);
      const currentDay = startOfWeek.getDay(); // 0 = الأحد
      startOfWeek.setDate(startOfWeek.getDate() - currentDay);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      dateStart = startOfWeek;
      dateEnd = endOfWeek;
    } 
    else if (filterType === "month") {
      dateStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } 
    else if (filterType === "year") {
      dateStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      dateEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } 
    else if (filterType === "custom" && startDate && endDate) {
      dateStart = new Date(startDate);
      dateStart.setHours(0, 0, 0, 0);

      dateEnd = new Date(endDate);
      dateEnd.setHours(23, 59, 59, 999);
    }

    // 4. تطبيق الفلترة الزمانية على حقل slot مباشرة
    if (filterType && filterType !== "all" && dateStart && dateEnd) {
      baseQuery.slot = {
        $gte: dateStart,
        $lte: dateEnd
      };
    }

    // 5. جلب الحجوزات من قاعدة البيانات
    const appointments = await AppointmentModel.find(baseQuery).sort({ slot: 1 });

    // 6. حساب الإحصائيات
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === "completed").length;
    const pendingAppointments = appointments.filter(a => a.status === "pending" || !a.status).length;
    const cancelledAppointments = appointments.filter(a => a.status === "cancelled").length;

    const attendanceRate = totalAppointments > 0 
      ? Math.round((completedAppointments / totalAppointments) * 100) 
      : 0;

    // 7. تجميع بيانات المخطط البياني بالأيام بناءً على slot
    const daysOrder = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const daysMap = {};

    daysOrder.forEach(day => {
      daysMap[day] = { name: day, appointments: 0, completed: 0 };
    });

    appointments.forEach(app => {
      if (app.slot) {
        const dateObj = new Date(app.slot);
        if (!isNaN(dateObj.getTime())) {
          const dayName = daysOrder[dateObj.getDay()];
          if (daysMap[dayName]) {
            daysMap[dayName].appointments += 1;
            if (app.status === "completed") {
              daysMap[dayName].completed += 1;
            }
          }
        }
      }
    });

    const chartData = Object.values(daysMap);

    // 8. توزيع الحالات للمخطط الدائري
    const statusDistribution = [
      { name: "مكتملة", value: completedAppointments, color: "#10b981" },
      { name: "قيد الانتظار", value: pendingAppointments, color: "#f59e0b" },
      { name: "ملغاة", value: cancelledAppointments, color: "#ef4444" }
    ];

    return res.status(200).json({
      success: true,
      stats: {
        totalAppointments,
        completedAppointments,
        pendingAppointments,
        cancelledAppointments,
        attendanceRate,
        chartData,
        statusDistribution
      }
    });

  } catch (error) {
    console.error("خطأ في جلب إحصائيات الطبيب:", error);
    return res.status(500).json({
      message: "خطأ في السيرفر أثناء جلب الإحصائيات",
      error: error.message
    });
  }
});
// =====================================================================
// 📌 1. إنشاء طبيب جديد (خاص بالأدمن والـ Boss فقط)
// =====================================================================
router.post("/Doctor", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "boss") {
      return res.status(403).json({ message: "خطأ في الصلاحية، يجب أن تكون أدمن أو مدير" });
    }

    const { doctor, medicalEntity, specialty, experience, description } = req.body;

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
      description
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
// 📌 2. البحث عن الأطباء (مفصول تماماً وخارج دالة الإضافة)
// =====================================================================
router.get("/search", async (req, res) => {
  try {
    const { search } = req.query;
    let doctorFilter = {};

    if (search && search.trim() !== "") {
      const cleanSearch = search
        .trim()
        .replace(/^(د\.?|د\/|دكتور|الدكتور)\s*/i, "");

      const searchRegex = new RegExp(cleanSearch, "i");

      const matchingUsers = await User.find({
        $or: [
          { username: searchRegex },
          { name: searchRegex }
        ]
      }).select("_id");

      const userIds = matchingUsers.map((user) => user._id);

      doctorFilter = {
        $or: [
          { doctor: { $in: userIds } },
          { specialty: searchRegex }
        ]
      };
    }

    const doctors = await Doctor.find(doctorFilter)
      .populate("doctor", "username name email image role")
      .populate("medicalEntity", "name location contactInfo entityType");

    return res.status(200).json({ 
      message: "True", 
      count: doctors.length,
      doctors: doctors 
    });

  } catch (error) {
    console.error("خطأ في البحث عن الأطباء:", error);
    return res.status(500).json({ 
      message: "خطأ في السيرفر أثناء جلب الأطباء", 
      error: error.message 
    });
  }
});

// =====================================================================
// 📌 3. جلب جميع الأطباء
// =====================================================================
router.get("/Doctors", async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate("doctor", "username name email image role")
      .populate("medicalEntity", "name location contactInfo entityType");

    return res.status(200).json({ message: "True", doctors: doctors });
  } catch (error) {
    return res.status(500).json({ message: "خطأ في السيرفر أثناء جلب الأطباء", error: error.message });
  }
});

// =====================================================================
// 📌 4. جلب تفاصيل طبيب واحد بواسطة الـ ID الخاص به أو ID الحساب
// =====================================================================
router.get("/Doctors/:id", async (req, res) => {
  try {
    const doctorId = req.params.id;

    let doctor = await Doctor.findOne({
      $or: [{ _id: doctorId }, { doctor: doctorId }]
    })
      .populate("doctor", "username name email image role")
      .populate("medicalEntity", "name location contactInfo entityType");

    if (!doctor) {
      return res.status(404).json({ message: "False", error: "لم يتم العثور على الطبيب" });
    }

    return res.status(200).json({ message: "True", doctor: doctor });
  } catch (error) {
    return res.status(500).json({ message: "خطأ في السيرفر أثناء جلب بيانات الطبيب", error: error.message });
  }
});

// =====================================================================
// 📌 5. إيقاف/تفعيل الحجز لطبيب معين
// =====================================================================
router.patch("/doctors/:id/toggle-booking", auth, async (req, res) => {
  try {
    const doctorId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "معرف الطبيب غير صالح" });
    }

    const doctor = await Doctor.findById(doctorId).populate("medicalEntity");
    if (!doctor) {
      return res.status(404).json({ message: "ملف الطبيب غير موجود" });
    }

    const userId = req.user.id || req.user._id;
    const isAdmin = req.user.role === "admin";
    
    const isOwner = doctor.medicalEntity && doctor.medicalEntity.owner.toString() === userId.toString();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "غير مصرح لك بالتحكم في حجوزات هذا الطبيب" });
    }

    doctor.isBookingAllowed = !doctor.isBookingAllowed;
    await doctor.save();

    return res.status(200).json({
      success: true,
      message: `تم ${doctor.isBookingAllowed ? "تفعيل" : "إيقاف"} الحجز للطبيب بنجاح`,
      isBookingAllowed: doctor.isBookingAllowed
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
// =====================================================================
// 📌 جلب جميع حجوزات طبيب معين بالتفصيل (للطبيب أو الأدمن أو صاحب المنشأة)
// =====================================================================
router.get("/doctor/:doctorId/appointments", auth, async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, status, search, page = 1, limit = 20 } = req.query;

    
    // 1. التحقق من صحة معرف الطبيب
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ message: "معرف الطبيب غير صالح" });
    }

    // 2. البحث عن ملف الطبيب للتأكد من وجوده وللتحقق من الصلاحيات
    const doctorProfile = await Doctor.findOne({
      $or: [{ _id: doctorId }, { doctor: doctorId }]
    }).populate("medicalEntity");

    if (!doctorProfile) {
      return res.status(404).json({ message: "لم يتم العثور على ملف الطبيب" });
    }

    // 3. التحقق من الصلاحيات (المدير، الأدمن، أو الطبيب نفسه)
    const currentUserId = (req.user.id || req.user._id).toString();
    const isAdmin = req.user.role === "admin";
    const isDoctorHimself = doctorProfile.doctor.toString() === currentUserId;
    const isOwner =
      doctorProfile.medicalEntity &&
      doctorProfile.medicalEntity.owner &&
      doctorProfile.medicalEntity.owner.toString() === currentUserId;

    if (!isAdmin && !isDoctorHimself && !isOwner) {
      return res.status(403).json({
        message: "غير مصرح لك بالاطلاع على حجوزات هذا الطبيب"
      });
    }

    // 4. بناء فلتر الاستعلام (Query Filter)
    // نستخدم doctorProfile.doctor (معرف حساب المستخدم) أو doctorProfile._id حسب تصميم الموديل لديك
    const filter = {
      $or: [{ doctor: doctorProfile._id }, { doctor: doctorProfile.doctor }]
    };

    // فلترة حسب الحالة (مثل: pending, confirmed, cancelled, completed)
    if (status) {
      filter.status = status;
    }

    // فلترة حسب تاريخ معين (YYYY-MM-DD)
    if (date) {
      const searchDate = new Date(date);
      const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

      filter.appointmentDate = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    // 5. جلب الحجوزات مع التصفيم (Pagination) و التعبئة (Populate)
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // افترضنا أن اسم الموديل الخاص بالحجوزات هو Appointment (عدّله إذا كان Slot)
    const AppointmentModel = mongoose.model("Appointment") || mongoose.model("Slot");

    let query = AppointmentModel.find(filter)
      .populate("user", "name username email phone image") // بيانات المريض/المستخدم
      .populate("medicalEntity", "name location contactInfo") // بيانات المنشأة
      .sort({ appointmentDate: 1, slotTime: 1 }) // ترتيب المواعيد تصاعدياً
      .skip(skip)
      .limit(parseInt(limit));

    const appointments = await query.exec();

    // فلترة بالبحث عن اسم المريض أو رقم هاتفه (إذا تم تمرير search في الـ Query)
    let filteredAppointments = appointments;
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      filteredAppointments = appointments.filter((item) => {
        const patientName = item.user?.name || item.user?.username || "";
        const patientPhone = item.user?.phone || "";
        return searchRegex.test(patientName) || searchRegex.test(patientPhone);
      });
    }

    // 6. إحصائيات سريعة للطلبات
    const totalAppointments = await AppointmentModel.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "تم جلب حجوزات الطبيب بنجاح",
      count: filteredAppointments.length,
      totalCount: totalAppointments,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalAppointments / parseInt(limit)),
      doctor: {
        id: doctorProfile._id,
        specialty: doctorProfile.specialty,
        isBookingAllowed: doctorProfile.isBookingAllowed
      },
      appointments: filteredAppointments
    });

  } catch (error) {
    console.error("خطأ في جلب حجوزات الطبيب:", error);
    return res.status(500).json({
      message: "خطأ في السيرفر أثناء جلب حجوزات الطبيب",
      error: error.message
    });
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
    const deletedDoctor = await Doctor.findByIdAndDelete(doctorId);

    if (!deletedDoctor) {
      return res.status(404).json({ message: "False", error: "الطبيب غير موجود بالفعل" });
    }

    if (deletedDoctor.medicalEntity) {
      await MedicalEntity.findByIdAndUpdate(deletedDoctor.medicalEntity, {
        $pull: { doctors: deletedDoctor.doctor }
      });
    }

    return res.status(200).json({ message: "True", deletedDoctor: deletedDoctor });

  } catch (error) {
    return res.status(500).json({ message: "خطأ في السيرفر أثناء الحذف", error: error.message });
  }
});

module.exports = router;