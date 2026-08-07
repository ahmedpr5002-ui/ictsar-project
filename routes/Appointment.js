const express = require('express');
const router = express.Router();
const moment = require('moment-timezone');
require('moment/locale/ar-sa'); 
const Appointment = require('../model/AppointmentSchema'); 
const Doctor = require('../model/DoctorSchema'); 
const MedicalEntity = require('../model/MedicalcomplexSchema');
const User = require('../model/UserSchema'); 
const authMiddleware = require('../auth/jwt'); 
const TIMEZONE = "Asia/Riyadh"; 
const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const formatArabicDate = (date) => {
    if (!date) return '';
    return moment(date)
        .tz(TIMEZONE)
        .locale('ar-sa')
        .format('dddd، D MMMM YYYY [الساعة] hh:mm A');
};
const getWorkingHoursForDate = (medicalEntity, targetMoment) => {
    const dayIndex = targetMoment.day();
    const dayName = ARABIC_DAYS[dayIndex];

    if (!medicalEntity.workingHours || !Array.isArray(medicalEntity.workingHours)) {
        return null;
    }
    const dayConfig = medicalEntity.workingHours.find(w => w.day === dayName);

    if (!dayConfig || dayConfig.isClosed) {
        return { isClosed: true, dayName };
    }
    return {
        isClosed: false,
        dayName,
        from: dayConfig.from || '09:00',
        to: dayConfig.to || '17:00',
        slotDuration: Number(dayConfig.slotDuration) || 15
    };
};
// دالة لجلب أول موعد متاح مع استبعاد المواعيد المحجوزة والتدوير للأيام القادمة عند امتلاء اليوم
// دالة لجلب أول موعد متاح مع استبعاد المواعيد المحجوزة والتدوير للأيام القادمة عند امتلاء اليوم
const findNextAvailableSlot = async (doctorId, entity, startMoment) => {
    let checkMoment = startMoment.clone();
    const nowLocal = moment().tz(TIMEZONE);

    // البحث خلال 30 يوماً قادمة
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
        const daySchedule = getWorkingHoursForDate(entity, checkMoment);

        if (!daySchedule || daySchedule.isClosed) {
            checkMoment.add(1, 'days').startOf('day');
            continue;
        }
        const dateString = checkMoment.format('YYYY-MM-DD');
        let currentSlot = moment.tz(`${dateString} ${daySchedule.from}`, "YYYY-MM-DD HH:mm", TIMEZONE);
        const endSlot = moment.tz(`${dateString} ${daySchedule.to}`, "YYYY-MM-DD HH:mm", TIMEZONE);

        if (checkMoment.isSame(startMoment, 'day') && startMoment.isAfter(currentSlot)) {
            const remainder = daySchedule.slotDuration - (startMoment.minute() % daySchedule.slotDuration);
            currentSlot = startMoment.clone().add(remainder, 'minutes').seconds(0).milliseconds(0);
        }

        const startOfDay = checkMoment.clone().startOf('day').toDate();
        const endOfDay = checkMoment.clone().endOf('day').toDate();

        // جلب المواعيد النشطة فقط (تضمين medicalEntity)
        const bookedAppointments = await Appointment.find({
            doctor: doctorId,
            medicalEntity: entity._id,
            slot: { $gte: startOfDay, $lte: endOfDay },
            status: { $nin: ['cancelled', 'no_show'] }
        }).select('slot');

        // تحويل أوقات المواعيد المحجوزة لنصوص ISO دقيقة دون أجزاء من الثانية
        const bookedISOStrings = bookedAppointments.map(app => 
            moment(app.slot).tz(TIMEZONE).startOf('minute').toISOString()
        );

        while (currentSlot.isBefore(endSlot)) {
            const slotISO = currentSlot.clone().startOf('minute').toISOString();
            
            if (currentSlot.isAfter(nowLocal) && !bookedISOStrings.includes(slotISO)) {
                return currentSlot.toDate();
            }
            currentSlot.add(daySchedule.slotDuration, 'minutes');
        }

        checkMoment.add(1, 'days').startOf('day');
    }
    return null;
};
const formatAppointmentResponse = (appointment) => {
    return {
        _id: appointment._id,
        user: appointment.user,
        doctor: appointment.doctor,
        medicalEntity: appointment.medicalEntity,
        status: appointment.status,
        slot_UTC: appointment.slot,
        readableLocalTime: formatArabicDate(appointment.slot),
        diagnosis: appointment.diagnosis || '',
        prescription: appointment.prescription || '',
        medications: appointment.medications || [],
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt
    };
};
// 1. جلب المواعيد المتاحة
// 1. جلب المواعيد المتاحة
router.get("/available-slots", async (req, res) => {
    try {
        let { doctorId, medicalEntityId, date } = req.query; 
        if (!doctorId || !medicalEntityId) {
            return res.status(400).send({ message: "يجب تحديد معرف الطبيب والمنشأة الطبية" });
        }
        const targetDate = date ? moment.tz(date, "YYYY-MM-DD", TIMEZONE) : moment().tz(TIMEZONE);
        const dateStr = targetDate.format('YYYY-MM-DD');
        const entity = await MedicalEntity.findById(medicalEntityId);
        if (!entity || !entity.isActive) {
            return res.status(404).send({ message: "المنشأة الطبية غير موجودة أو غير مفعلة" });
        }
        const daySchedule = getWorkingHoursForDate(entity, targetDate);
        if (!daySchedule || daySchedule.isClosed) {
            return res.status(200).send({
                date: dateStr,
                day: daySchedule ? daySchedule.dayName : "غير معروف",
                isClosed: true,
                message: "المنشأة مغلقة في هذا اليوم",
                availableSlots: []
            });
        }
        const allSlots = [];
        let currentSlot = moment.tz(`${dateStr} ${daySchedule.from}`, "YYYY-MM-DD HH:mm", TIMEZONE);
        const endSlot = moment.tz(`${dateStr} ${daySchedule.to}`, "YYYY-MM-DD HH:mm", TIMEZONE);
        
        // تصفير الثواني والميلي ثانية
        while (currentSlot.isBefore(endSlot)) {
            allSlots.push(currentSlot.clone().seconds(0).milliseconds(0));
            currentSlot.add(daySchedule.slotDuration, 'minutes');
        }
        
        const startOfDay = targetDate.clone().startOf('day').toDate();
        const endOfDay = targetDate.clone().endOf('day').toDate();

        const bookedAppointments = await Appointment.find({
            doctor: doctorId,
            medicalEntity: medicalEntityId,
            slot: { $gte: startOfDay, $lte: endOfDay },
            status: { $nin: ['cancelled', 'no_show'] }
        }).select('slot');

        // المقارنة باستخدام ISO String الموحد بدلاً من get-time لتفادي فروق أجزاء الثانية
        const bookedISOStrings = bookedAppointments.map(app => 
            moment(app.slot).tz(TIMEZONE).startOf('minute').toISOString()
        );
        
        const nowLocal = moment().tz(TIMEZONE);

        const availableSlots = allSlots
            .filter(slotMoment => {
                const slotISO = slotMoment.toISOString();
                return !bookedISOStrings.includes(slotISO) && slotMoment.isAfter(nowLocal);
            })
            .map(slotMoment => ({
                raw: slotMoment.toDate(),
                formatted: formatArabicDate(slotMoment)
            }));

        return res.status(200).send({ 
            date: dateStr,
            day: daySchedule.dayName,
            workingHours: { 
                from: daySchedule.from, 
                to: daySchedule.to, 
                slotDurationMinutes: daySchedule.slotDuration 
            },
            availableSlots 
        });

    } catch (error) {
        return res.status(500).send({ message: "حدث خطأ أثناء توليد المواعيد المتاحة", error: error.message });
    }
});

// ---------------------------------------------------------------------
// 2. إنشاء حجز جديد (مع دعم إعادة حجز المواعيد الملغاة والطابور التلقائي)
// ---------------------------------------------------------------------
router.post("/slot", authMiddleware, async (req, res) => {
    try {
        const user = req.user.id;
        const { doctor, medicalEntity, slot } = req.body;

        if (!doctor || !medicalEntity) {
            return res.status(400).send({ message: "يجب تحديد معرف الطبيب والمنشأة الطبية بشكل صحيح" });
        }

        const entity = await MedicalEntity.findById(medicalEntity);
        if (!entity || !entity.isActive) {
            return res.status(404).send({ message: "المنشأة الطبية غير موجودة أو غير نشطة" });
        }

        let isShifted = false;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                let finalSlot = null;

                if (slot && attempts === 0) {
                    // 1. حجز موعد محدد من قبل المستخدم (تصفير الثواني والميلي ثانية)
                    const startMoment = moment(slot).tz(TIMEZONE).seconds(0).milliseconds(0);
                    const slotDate = startMoment.toDate();

                    if (startMoment.isBefore(moment().tz(TIMEZONE))) {
                        return res.status(400).send({ message: "لا يمكن حجز موعد في تاريخ أو وقت قد مضى" });
                    }

                    const daySchedule = getWorkingHoursForDate(entity, startMoment);

                    if (!daySchedule || daySchedule.isClosed) {
                        return res.status(400).send({ message: "المنشأة مغلقة في الوقت أو اليوم المحدد" });
                    }

                    // أ) التحقق مما إذا كان الموعد محجوزاً حالياً بحالة نشطة (غير ملغى)
                    const activeAppointment = await Appointment.findOne({
                        doctor,
                        medicalEntity,
                        slot: slotDate,
                        status: { $nin: ['cancelled', 'no_show'] }
                    });

                    if (activeAppointment) {
                        return res.status(400).send({ message: "عذراً، هذا الموعد تم حجزه مسبقاً، يرجى اختيار موعد آخر" });
                    }

                    // ب) البحث عن سجل ملغى سابقاً في نفس الوقت لإعادة استخدامه وتفادي خطأ E11000
                    const cancelledAppointment = await Appointment.findOne({
                        doctor,
                        medicalEntity,
                        slot: slotDate,
                        status: { $in: ['cancelled', 'no_show'] }
                    });

                    if (cancelledAppointment) {
                        cancelledAppointment.user = user;
                        cancelledAppointment.status = 'pending';
                        cancelledAppointment.diagnosis = '';
                        cancelledAppointment.prescription = '';
                        cancelledAppointment.medications = [];
                        
                        await cancelledAppointment.save();

                        return res.status(200).send({
                            message: 'تم تسجيل الحجز في الوقت المحدد بنجاح',
                            appointment_id: cancelledAppointment._id,
                            bookedTime_UTC: cancelledAppointment.slot,
                            readableLocalTime: formatArabicDate(cancelledAppointment.slot)
                        });
                    }

                    finalSlot = slotDate;
                } else {
                    // 2. الانضمام للطابور تلقائياً
                    const startMoment = moment().tz(TIMEZONE);
                    isShifted = true;
                    finalSlot = await findNextAvailableSlot(doctor, entity, startMoment);
                }

                if (!finalSlot) {
                    return res.status(400).send({ message: "عذراً، لم نجد أي مواعيد متاحة في الفترة القادمة." });
                }

                const newAppointment = new Appointment({
                    user,
                    doctor,
                    medicalEntity,
                    slot: finalSlot
                });

                await newAppointment.save();

                return res.status(201).send({ 
                    message: isShifted 
                        ? 'تم الانضمام للطابور بنجاح في أقرب موعد متاح' 
                        : 'تم تسجيل الحجز في الوقت المحدد بنجاح', 
                    appointment_id: newAppointment._id,
                    bookedTime_UTC: newAppointment.slot,
                    readableLocalTime: formatArabicDate(newAppointment.slot)
                });

            } catch (err) {
                if (err.code === 11000 && isShifted) {
                    attempts++;
                    continue;
                }
                throw err;
            }
        }

        return res.status(400).send({ message: "تعذر إكمال الحجز بسبب ضغط الحجوزات، يرجى إعادة المحاولة" });

    } catch (error) {
        console.error("BOOKING_ERROR_LOG:", error);
        if (error.code === 11000) {
            return res.status(400).send({ message: "عذراً، هذا الموعد تم حجزه للتو من قبل مستخدم آخر، يرجى إعادة المحاولة" });
        }
        return res.status(500).send({ message: "حدث خطأ في الخادم أثناء الحجز", error: error.message });
    }
});
// ---------------------------------------------------------------------
// 3. جلب كافة الحجوزات وحجوزات اليوم
// ---------------------------------------------------------------------
router.get("/slot", authMiddleware, async (req, res) => {
    try {
        const slots = await Appointment.find()
            .populate("user", "name email image")
            .populate("doctor", "name image")
            .populate("medicalEntity", "name location address");
            
        return res.status(200).send(slots.map(formatAppointmentResponse));
    } catch (error) {
        return res.status(500).send({ message: "خطأ في السيرفر", error: error.message });
    }
});

router.get("/todayslots", authMiddleware, async (req, res) => {
    try {
        const startOfToday = moment.tz(TIMEZONE).startOf('day').toDate();
        const endOfToday = moment.tz(TIMEZONE).endOf('day').toDate();

        const todaySlots = await Appointment.find({
            slot: { $gte: startOfToday, $lte: endOfToday },
            status: { $nin: ['cancelled', 'no_show'] }
        })
        .populate("user", "name email image")
        .populate("doctor", "name image")
        .populate("medicalEntity", "name location address");

        return res.status(200).send(todaySlots.map(formatAppointmentResponse));
    } catch (error) {
        return res.status(500).send({ message: "حدث خطأ أثناء جلب حجوزات اليوم", error: error.message });
    }
});

// ---------------------------------------------------------------------
// 4. جلب جميع حجوزات المستخدم الحالي
// ---------------------------------------------------------------------
router.get("/user-appointments", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const appointments = await Appointment.find({ user: userId })
            .populate({
                path: "doctor",
                select: "specialty experience doctor",
                populate: {
                    path: "doctor",
                    select: "name image email"
                }
            })
            .populate("medicalEntity", "name location address phone")
            .sort({ slot: -1 });

        const formattedAppointments = appointments.map(app => {
            let entityLocation = '';
            if (app.medicalEntity) {
                if (typeof app.medicalEntity.location === 'string') {
                    entityLocation = app.medicalEntity.location;
                } else if (typeof app.medicalEntity.location === 'object' && app.medicalEntity.location !== null) {
                    entityLocation = app.medicalEntity.location.city || app.medicalEntity.location.address || app.medicalEntity.address || '';
                } else {
                    entityLocation = app.medicalEntity.address || '';
                }
            }

            const doctorProfile = app.doctor || {};
            const userAccount = doctorProfile.doctor || {};

            const doctorName = userAccount.name || doctorProfile.name || 'طبيب غير محدد';
            const doctorImage = userAccount.image || doctorProfile.image || null;
            const doctorSpecialty = doctorProfile.specialty || 'تخصص غير محدد';

            return {
                _id: app._id,
                doctor: {
                    _id: doctorProfile._id,
                    name: doctorName,
                    specialization: doctorSpecialty,
                    image: doctorImage,
                    experience: doctorProfile.experience || 0
                },
                medicalEntity: {
                    _id: app.medicalEntity?._id,
                    name: app.medicalEntity?.name || 'المنشأة الطبية غير محددة',
                    location: entityLocation
                },
                status: app.status,
                slot_UTC: app.slot,
                readableLocalTime: formatArabicDate(app.slot),
                diagnosis: app.diagnosis || '',
                prescription: app.prescription || '',
                medications: app.medications || [],
                createdAt: app.createdAt
            };
        });

        return res.status(200).send({
            count: formattedAppointments.length,
            appointments: formattedAppointments
        });
    } catch (error) {
        return res.status(500).send({ 
            message: "حدث خطأ أثناء جلب حجوزات المستخدم", 
            error: error.message 
        });
    }
});

// ---------------------------------------------------------------------
// 5. جلب المريض القادم للطبيب
// ---------------------------------------------------------------------
router.get("/doctor/current-patient", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const doctorProfile = await Doctor.findOne({ doctor: userId });
        const doctorSearchIds = doctorProfile ? [doctorProfile._id, userId] : [userId];

        const startOfToday = moment.tz(TIMEZONE).startOf('day').toDate();
        const endOfToday = moment.tz(TIMEZONE).endOf('day').toDate();

        const currentAppointment = await Appointment.findOne({
            doctor: { $in: doctorSearchIds },
            slot: { $gte: startOfToday, $lte: endOfToday },
            status: 'pending'
        })
        .sort({ slot: 1 })
        .populate({
            path: "user",
            select: "name email image phone attendedAppointments missedAppointments"
        })
        .populate("medicalEntity", "name location address");

        if (!currentAppointment) {
            return res.status(200).send({
                success: true,
                message: "لا يوجد مريض في الانتظار حالياً لهذا اليوم",
                hasPatient: false,
                patient: null
            });
        }

        const patientData = currentAppointment.user || {};

        return res.status(200).send({
            success: true,
            hasPatient: true,
            appointmentId: currentAppointment._id,
            status: currentAppointment.status,
            slot_UTC: currentAppointment.slot,
            readableLocalTime: formatArabicDate(currentAppointment.slot),
            patient: {
                _id: patientData._id,
                name: patientData.name || 'مريض غير مسمى',
                email: patientData.email || '',
                phone: patientData.phone || '',
                image: patientData.image || null,
                attendedAppointments: Math.max(0, patientData.attendedAppointments || 0),
                missedAppointments: Math.max(0, patientData.missedAppointments || 0)
            },
            medicalEntity: {
                _id: currentAppointment.medicalEntity?._id,
                name: currentAppointment.medicalEntity?.name || ''
            }
        });

    } catch (error) {
        console.error("CURRENT_PATIENT_FETCH_ERROR:", error);
        return res.status(500).send({
            message: "حدث خطأ أثناء جلب بيانات المريض القادم",
            error: error.message
        });
    }
});

// ---------------------------------------------------------------------
// 6. إضافة وإرسال الوصفة الطبية
// ---------------------------------------------------------------------
router.post("/slot/:id/prescription", authMiddleware, async (req, res) => {
    try {
        const { diagnosis, prescription, medications } = req.body;
        const appointmentId = req.params.id;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).send({ message: "لم يتم العثور على هذا الحجز" });
        }

        const previousStatus = appointment.status;

        appointment.diagnosis = diagnosis || appointment.diagnosis;
        appointment.prescription = prescription || appointment.prescription;
        if (Array.isArray(medications)) {
            appointment.medications = medications;
        }
        appointment.status = 'completed';
        appointment.prescriptionPreservedAt = new Date();

        await appointment.save();

        if (previousStatus !== 'completed') {
            const incQuery = { attendedAppointments: 1 };
            if (previousStatus === 'no_show') {
                incQuery.missedAppointments = -1;
            }
            await User.findByIdAndUpdate(appointment.user, { $inc: incQuery });
        }

        return res.status(200).send({
            message: "تم حفظ وإرسال الوصفة الطبية، وتحول الحجز إلى مكتمل بنجاح",
            appointment: formatAppointmentResponse(appointment)
        });

    } catch (error) {
        console.error("PRESCRIPTION_ERROR:", error);
        return res.status(500).send({ 
            message: "حدث خطأ أثناء إرسال الوصفة الطبية", 
            error: error.message 
        });
    }
});

// ---------------------------------------------------------------------
// 7. جلب السجل الطبي الكامل للمريض
// ---------------------------------------------------------------------
router.get('/patient/:patientId/history', authMiddleware, async (req, res) => {
    try {
        const { patientId } = req.params;

        const appointments = await Appointment.find({
            user: patientId,
            status: 'completed'
        })
        .sort({ slot: -1 })
        .populate({
            path: 'doctor',
            select: 'name specialization doctor',
            populate: {
                path: 'doctor',
                select: 'name'
            }
        })
        .lean();

        const history = appointments.map(app => {
            const doctorObj = app.doctor || {};
            const doctorUser = doctorObj.doctor || {};
            const doctorName = doctorUser.name || doctorObj.name || 'الطبيب المعالج';

            return {
                _id: app._id,
                date: app.slot ? formatArabicDate(app.slot) : 'تاريخ غير محدد',
                doctorName,
                diagnosis: app.diagnosis || '',
                prescription: app.prescription || '',
                medications: app.medications || []
            };
        });

        return res.status(200).json({
            success: true,
            count: history.length,
            history
        });

    } catch (error) {
        console.error('Error fetching patient history:', error);
        return res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم أثناء جلب السجل الطبي'
        });
    }
});

// ---------------------------------------------------------------------
// 8. إلغاء وحذف وتحديث المواعيد
// ---------------------------------------------------------------------
router.put("/cancel-appointment/:id", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const appointmentId = req.params.id;

        const appointment = await Appointment.findOne({ 
            _id: appointmentId, 
            user: userId 
        });

        if (!appointment) {
            return res.status(404).send({ message: "لم يتم العثور على هذا الحجز أو لا تملك صلاحية لإلغائه" });
        }

        if (appointment.status === 'cancelled') {
            return res.status(400).send({ message: "هذا الموعد ملغى بالفعل" });
        }

        if (appointment.status === 'completed') {
            return res.status(400).send({ message: "لا يمكن إلغاء موعد قد تم اكتماله بالفعل" });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        return res.status(200).send({
            message: "تم إلغاء الحجز بنجاح",
            appointment_id: appointment._id,
            status: appointment.status
        });

    } catch (error) {
        return res.status(500).send({ 
            message: "حدث خطأ أثناء إلغاء الحجز", 
            error: error.message 
        });
    }
});

router.delete("/slot/:id", async (req, res) => {
    try {
        const deletedSlot = await Appointment.findByIdAndDelete(req.params.id);
        if(!deletedSlot){
            return res.status(400).send({ message: 'الموعد غير موجود' });
        }
        return res.status(200).send({ status: "deleted", slot: deletedSlot });
    } catch (error) {
        return res.status(500).send({ message: "حدث خطأ أثناء حذف الحجز", error: error.message });
    }
});

router.put("/slot/:id", authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const appointmentId = req.params.id;
        const validStatuses = ['pending', 'completed', 'cancelled', 'no_show'];
        
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).send({ message: "حالة الموعد غير صالحة" });
        }

        const oldAppointment = await Appointment.findById(appointmentId);
        if (!oldAppointment) {
            return res.status(404).send({ message: "لم يتم العثور على هذا الحجز" });
        }

        const previousStatus = oldAppointment.status;

        if (previousStatus === status) {
            const currentApp = await Appointment.findById(appointmentId)
                .populate("user", "name email image role phone attendedAppointments missedAppointments")
                .populate("doctor", "name image")
                .populate("medicalEntity", "name");
            return res.status(200).send({ 
                message: "حالة الحجز محدثة بالفعل", 
                appointment: formatAppointmentResponse(currentApp) 
            });
        }

        const updatedAppointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            { status },
            { new: true } 
        )
        .populate("user", "name email image role phone attendedAppointments missedAppointments")
        .populate("doctor", "name image")
        .populate("medicalEntity", "name");

        if (updatedAppointment && updatedAppointment.user) {
            const userId = updatedAppointment.user._id || updatedAppointment.user;
            let incQuery = {};

            if (status === 'completed' && previousStatus !== 'completed') {
                incQuery.attendedAppointments = 1;
                if (previousStatus === 'no_show') {
                    incQuery.missedAppointments = -1;
                }
            } 
            else if (status === 'no_show' && previousStatus !== 'no_show') {
                incQuery.missedAppointments = 1;
                if (previousStatus === 'completed') {
                    incQuery.attendedAppointments = -1;
                }
            } 
            else {
                if (previousStatus === 'completed') {
                    incQuery.attendedAppointments = -1;
                } else if (previousStatus === 'no_show') {
                    incQuery.missedAppointments = -1;
                }
            }

            if (Object.keys(incQuery).length > 0) {
                await User.findByIdAndUpdate(userId, { $inc: incQuery });
            }
        }

        return res.status(200).send({ 
            message: "تم تحديث حالة الحجز بنجاح", 
            appointment: formatAppointmentResponse(updatedAppointment) 
        });

    } catch (error) {
        console.error("UPDATE_SLOT_ERROR:", error);
        return res.status(500).send({ 
            message: "حدث خطأ أثناء تحديث حالة الحجز", 
            error: error.message 
        });
    }
});
// ---------------------------------------------------------------------
// 9. جلب حجوزات المنشأة الطبية مع الفلترة والترقيم
// ---------------------------------------------------------------------
router.get("/entity-appointments/:medicalEntityId", authMiddleware, async (req, res) => {
    try {
        const { medicalEntityId } = req.params;
        const { 
            doctorId, 
            status, 
            startDate, 
            endDate, 
            isToday, 
            search,
            page = 1, 
            limit = 10,
            sortBy = 'slot',
            sortOrder = 'desc'
        } = req.query;

        let query = { medicalEntity: medicalEntityId };

        if (doctorId && doctorId !== 'undefined' && doctorId !== 'null' && doctorId.trim() !== '' && doctorId !== 'all') {
            const cleanDocId = doctorId.trim();
            const docProfile = await Doctor.findById(cleanDocId);
            
            if (docProfile) {
                query.doctor = { $in: [docProfile._id, docProfile.doctor] };
            } else {
                const docByUser = await Doctor.findOne({ doctor: cleanDocId });
                if (docByUser) {
                    query.doctor = { $in: [docByUser._id, cleanDocId] };
                } else {
                    query.doctor = cleanDocId;
                }
            }
        }

        if (status && status !== 'undefined' && status !== 'null' && status.trim() !== '' && status !== 'all') {
            if (status.includes(',')) {
                query.status = { $in: status.split(',').map(s => s.trim()) };
            } else {
                query.status = status.trim();
            }
        }

        if (isToday === 'true') {
            const startOfToday = moment.tz(TIMEZONE).startOf('day').toDate();
            const endOfToday = moment.tz(TIMEZONE).endOf('day').toDate();
            query.slot = { $gte: startOfToday, $lte: endOfToday };
        } else if ((startDate && startDate !== 'undefined') || (endDate && endDate !== 'undefined')) {
            query.slot = {};
            if (startDate && startDate !== 'undefined' && startDate.trim() !== '') {
                query.slot.$gte = moment.tz(startDate, TIMEZONE).startOf('day').toDate();
            }
            if (endDate && endDate !== 'undefined' && endDate.trim() !== '') {
                query.slot.$lte = moment.tz(endDate, TIMEZONE).endOf('day').toDate();
            }
        }

        if (search && search.trim() !== '' && search !== 'undefined') {
            const searchRegex = new RegExp(search.trim(), 'i');
            
            const matchingUsers = await User.find({
                $or: [
                    { name: searchRegex },
                    { email: searchRegex },
                    { phone: searchRegex }
                ]
            }).select('_id');

            const userIds = matchingUsers.map(u => u._id);
            query.user = { $in: userIds };
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, parseInt(limit, 10) || 10);
        const skip = (pageNum - 1) * limitNum;
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const [appointments, totalAppointments] = await Promise.all([
            Appointment.find(query)
                .populate({
                    path: "user",
                    // 👈 تم إدخال attendedAppointments و missedAppointments هنا
                    select: "name email image role phone attendedAppointments missedAppointments"
                })
                .populate({
                    path: "doctor",
                    select: "specialty experience isAvailable isBookingAllowed doctor name",
                    populate: {
                        path: "doctor",
                        select: "name image email"
                    }
                })
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum),
            Appointment.countDocuments(query)
        ]);

        const formattedAppointments = appointments.map(app => {
            const patient = app.user || {};
            const doctorProfile = app.doctor || {};
            const doctorUser = doctorProfile.doctor || {};

            return {
                _id: app._id,
                user: {
                    _id: patient._id,
                    name: patient.name || 'مريض غير مسمى',
                    email: patient.email || '',
                    image: patient.image || null,
                    phone: patient.phone || '',
                    // 👈 تم تضمين الأعداد الحقيقية في الاستجابة مع ضمان عدم ظهور قيم سالبة
                    attendedAppointments: Math.max(0, patient.attendedAppointments || 0),
                    missedAppointments: Math.max(0, patient.missedAppointments || 0)
                },
                doctor: {
                    _id: doctorProfile._id,
                    name: doctorUser.name || doctorProfile.name || app.doctorName || 'طبيب غير محدد',
                    image: doctorUser.image || doctorProfile.image || null,
                    specialty: doctorProfile.specialty || '',
                    experience: doctorProfile.experience || 0,
                    isAvailable: doctorProfile.isAvailable ?? true
                },
                status: app.status,
                slot_UTC: app.slot,
                readableLocalTime: formatArabicDate(app.slot),
                diagnosis: app.diagnosis || '',
                prescription: app.prescription || '',
                medications: app.medications || [],
                createdAt: app.createdAt,
                updatedAt: app.updatedAt
            };
        });

        // إرجاع النتيجة بنفس التنسيق تماماً
        return res.status(200).send({
            appointments: formattedAppointments,
            pagination: {
                totalItems: totalAppointments,
                currentPage: pageNum,
                totalPages: Math.ceil(totalAppointments / limitNum),
                hasNextPage: pageNum * limitNum < totalAppointments,
                hasPrevPage: pageNum > 1
            }
        });

    } catch (error) {
        console.error("ENTITY_APPOINTMENTS_ERROR:", error);
        return res.status(500).send({
            message: "حدث خطأ أثناء جلب حجوزات المنشأة الطبية",
            error: error.message
        });
    }
});

module.exports = router;