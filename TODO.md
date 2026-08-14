# خطة التعديلات الشاملة - نظام ICTsar

## المرحلة 1: أوقات وأيام عمل الطبيب المستقل (Backend) ✅
- [x] تعديل `model/DoctorSchema.js` - إضافة workingDays, workingHours موسعة, unavailableDates
- [x] إضافة endpoints جديدة في `routes/doctor.js` لجلب/تحديث جدول الطبيب

## المرحلة 2: إعادة هيكلة منطق الحجز (Backend) ✅
- [x] تعديل `routes/Appointment.js` - استخدام جدول الطبيب أولاً
- [x] إضافة تحقق من unavailableDates في الحجز
- [x] إضافة endpoint الحجز اليدوي/النيابي

## المرحلة 3: صلاحيات الـ Boss (Backend + Frontend)
- [x] إضافة PATCH /doctors/:id/unavailable-dates في `routes/doctor.js`
- [x] إضافة endpoint الحجز اليدوي في `routes/Appointment.js`
- [ ] تحديث `EntityDashboard.jsx` - واجهة إدارة تواريخ الإغلاق + زر الحجز اليدوي

## المرحلة 4: صفحة تواصل معنا (Frontend)
- [ ] إنشاء `src/page/ContactUs/ContactUs.jsx` + CSS
- [ ] إضافة للـ BottomNav للمستخدمين فقط

## المرحلة 5: تحسين الواجهات (Frontend)
- [ ] تحديث شامل لملفات CSS (Modern Premium Mobile-First)

## المرحلة 6: إصلاح العيادات القريبة (Backend + Frontend)
- [ ] تعديل `routes/medicalEntity.js` - حساب المسافة الفعلية وفرز النتائج
- [ ] تحديث `Home.jsx` - عرض المسافة الصحيحة

## المرحلة 7: تحسينات عامة
- [ ] إصلاح Bug تسجيل الدخول في `login.jsx`
- [ ] إصلاح مسار `DoctorStats.jsx` المكرر
- [ ] اقتراح مميزات جديدة
