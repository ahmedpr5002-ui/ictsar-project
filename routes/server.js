// // // // // const express = require('express');
// // // // // const router = express.Router();
// // // // // const axios = require('axios');

// // // // // // إعدادات TextBee API الرسمية
// // // // // const TEXTBEE_API_URL = 'https://api.textbee.dev/api/v1/gateway/send-sms';
// // // // // const TEXTBEE_API_KEY = 'txb_fQARCe3oNG6Td8s8HXeZeJUb7MRe1clq';   
// // // // // const TEXTBEE_DEVICE_ID = '6acf7e7074e21da91adaab26';         

// // // // // const otpStore = new Map();

// // // // // // 1. إرسال رمز التحقق عبر TextBee API (نص إنجليزي لضمان عدم حدوث خطأ ترميز في الهاتف)
// // // // // router.post('/send-whatsapp-otp', async (req, res) => {
// // // // //   const { phone } = req.body;
// // // // //   if (!phone) return res.status(400).json({ message: 'رقم الهاتف مطلوب' });

// // // // //   // تنسيق الرقم بالصيغة الدولية
// // // // //   let cleanPhone = phone.replace(/\D/g, '');
// // // // //   if (cleanPhone.startsWith('0')) {
// // // // //     cleanPhone = '964' + cleanPhone.slice(1);
// // // // //   } else if (!cleanPhone.startsWith('964')) {
// // // // //     cleanPhone = '964' + cleanPhone;
// // // // //   }
// // // // //   const formattedPhone = `+${cleanPhone}`;

// // // // //   const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

// // // // //   otpStore.set(formattedPhone, {
// // // // //     code: otpCode,
// // // // //     expiresAt: Date.now() + 5 * 60 * 1000,
// // // // //   });

// // // // //   try {
// // // // //     const response = await axios.post(
// // // // //       TEXTBEE_API_URL,
// // // // //       {
// // // // //         deviceId: TEXTBEE_DEVICE_ID,
// // // // //         recipients: [formattedPhone],
// // // // //         message: `Your Ictsar verification code is: ${otpCode} (Valid for 5 minutes).`,
// // // // //       },
// // // // //       {
// // // // //         headers: {
// // // // //           'x-api-key': TEXTBEE_API_KEY,
// // // // //           'Content-Type': 'application/json'
// // // // //         }
// // // // //       }
// // // // //     );

// // // // //     console.log('TextBee Response:', response.data);
// // // // //     res.json({ success: true, message: 'تم إرسال رمز التحقق بنجاح' });
// // // // //   } catch (err) {
// // // // //     console.error('TextBee Error:', err.response?.data || err.message);
// // // // //     res.status(500).json({ message: 'فشل إرسال الرسالة، يرجى المحاولة لاحقاً' });
// // // // //   }
// // // // // });

// // // // // // 2. التحقق من الرمز فقط بدون الحاجة لـ Firebase
// // // // // router.post('/verify-whatsapp-otp', async (req, res) => {
// // // // //   const { phone, code } = req.body;
// // // // //   if (!phone || !code) {
// // // // //     return res.status(400).json({ message: 'رقم الهاتف ورمز التحقق مطلوبان' });
// // // // //   }

// // // // //   let cleanPhone = phone.replace(/\D/g, '');
// // // // //   if (cleanPhone.startsWith('0')) {
// // // // //     cleanPhone = '964' + cleanPhone.slice(1);
// // // // //   } else if (!cleanPhone.startsWith('964')) {
// // // // //     cleanPhone = '964' + cleanPhone;
// // // // //   }
// // // // //   const formattedPhone = `+${cleanPhone}`;

// // // // //   const storedData = otpStore.get(formattedPhone);

// // // // //   if (!storedData) {
// // // // //     return res.status(400).json({ message: 'انتهت صلاحية الرمز أو لم يتم طلبه' });
// // // // //   }

// // // // //   if (Date.now() > storedData.expiresAt) {
// // // // //     otpStore.delete(formattedPhone);
// // // // //     return res.status(400).json({ message: 'انتهت صلاحية الرمز' });
// // // // //   }

// // // // //   if (storedData.code !== code.toString().trim()) {
// // // // //     return res.status(400).json({ message: 'رمز التحقق غير صحيح' });
// // // // //   }

// // // // //   // حذف الرمز بعد نجاح المطابقة
// // // // //   otpStore.delete(formattedPhone);

// // // // //   res.json({ success: true, message: 'تم التحقق من الرمز بنجاح' });
// // // // // });

// // // // // module.exports = router;
// // // // const express = require('express');
// // // // const router = express.Router();
// // // // const axios = require('axios');

// // // // // الإعدادات الصحيحة لمنصة SMSGate
// // // // const SMSGATE_API_URL = 'https://api.sms-gate.app/3rdparty/v1/messages?skipPhoneValidation=true';
// // // // const SMSGATE_USERNAME = 'O8BNJ1';
// // // // const SMSGATE_PASSWORD = 'rgab4pqq1ec9s_';
// // // // const SMSGATE_DEVICE_ID = 'ROzngDINLb6tSzP0Uqu7k';

// // // // const otpStore = new Map();

// // // // // 1. إرسال رمز التحقق عبر SMSGate API
// // // // router.post('/send-whatsapp-otp', async (req, res) => {
// // // //   const { phone } = req.body;
// // // //   if (!phone) return res.status(400).json({ message: 'رقم الهاتف مطلوب' });

// // // //   // تنسيق الرقم بالصيغة الدولية
// // // //   let cleanPhone = phone.replace(/\D/g, '');
// // // //   if (cleanPhone.startsWith('0')) {
// // // //     cleanPhone = '964' + cleanPhone.slice(1);
// // // //   } else if (!cleanPhone.startsWith('964')) {
// // // //     cleanPhone = '964' + cleanPhone;
// // // //   }
// // // //   const formattedPhone = `+${cleanPhone}`;

// // // //   const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

// // // //   otpStore.set(formattedPhone, {
// // // //     code: otpCode,
// // // //     expiresAt: Date.now() + 5 * 60 * 1000,
// // // //   });

// // // //   try {
// // // //     const credentials = Buffer.from(`${SMSGATE_USERNAME}:${SMSGATE_PASSWORD}`).toString('base64');

// // // //     const response = await axios.post(
// // // //       SMSGATE_API_URL,
// // // //       {
// // // //         deviceId: SMSGATE_DEVICE_ID,
// // // //         phoneNumbers: [formattedPhone],
// // // //         message: `Your Ictsar verification code is: ${otpCode} (Valid for 5 minutes).`
// // // //       },
// // // //       {
// // // //         headers: {
// // // //           'Authorization': `Basic ${credentials}`,
// // // //           'Content-Type': 'application/json'
// // // //         }
// // // //       }
// // // //     );

// // // //     console.log('SMSGate Response:', response.data);
// // // //     res.json({ success: true, message: 'تم إرسال رمز التحقق بنجاح' });
// // // //   } catch (err) {
// // // //     console.error('SMSGate Error:', err.response?.data || err.message);
// // // //     res.status(500).json({ message: 'فشل إرسال الرسالة، يرجى التحقق من اتصال هاتف الـ SMS بالإنترنت' });
// // // //   }
// // // // });

// // // // // 2. التحقق من الرمز
// // // // router.post('/verify-whatsapp-otp', async (req, res) => {
// // // //   const { phone, code } = req.body;
// // // //   if (!phone || !code) {
// // // //     return res.status(400).json({ message: 'رقم الهاتف ورمز التحقق مطلوبان' });
// // // //   }

// // // //   let cleanPhone = phone.replace(/\D/g, '');
// // // //   if (cleanPhone.startsWith('0')) {
// // // //     cleanPhone = '964' + cleanPhone.slice(1);
// // // //   } else if (!cleanPhone.startsWith('964')) {
// // // //     cleanPhone = '964' + cleanPhone;
// // // //   }
// // // //   const formattedPhone = `+${cleanPhone}`;

// // // //   const storedData = otpStore.get(formattedPhone);

// // // //   if (!storedData) {
// // // //     return res.status(400).json({ message: 'انتهت صلاحية الرمز أو لم يتم طلبه' });
// // // //   }

// // // //   if (Date.now() > storedData.expiresAt) {
// // // //     otpStore.delete(formattedPhone);
// // // //     return res.status(400).json({ message: 'انتهت صلاحية الرمز' });
// // // //   }

// // // //   if (storedData.code !== code.toString().trim()) {
// // // //     return res.status(400).json({ message: 'رمز التحقق غير صحيح' });
// // // //   }

// // // //   otpStore.delete(formattedPhone);

// // // //   res.json({ success: true, message: 'تم التحقق من الرمز بنجاح' });
// // // // });

// // // // module.exports = router;
// // // const express = require('express');
// // // const router = express.Router();
// // // const { sendWhatsAppMessage } = require('./whatsappService'); // استدعاء دالة الإرسال

// // // const otpStore = new Map();

// // // // 1. إرسال رمز التحقق (OTP) عبر الواتساب
// // // router.post('/send-whatsapp-otp', async (req, res) => {
// // //   const { phone } = req.body;
// // //   if (!phone) return res.status(400).json({ message: 'رقم الهاتف مطلوب' });

// // //   // تنسيق الرقم
// // //   let cleanPhone = phone.replace(/\D/g, '');
// // //   if (cleanPhone.startsWith('0')) {
// // //     cleanPhone = '964' + cleanPhone.slice(1);
// // //   } else if (!cleanPhone.startsWith('964')) {
// // //     cleanPhone = '964' + cleanPhone;
// // //   }
// // //   const formattedPhone = `+${cleanPhone}`;

// // //   const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

// // //   otpStore.set(formattedPhone, {
// // //     code: otpCode,
// // //     expiresAt: Date.now() + 5 * 60 * 1000,
// // //   });

// // //   try {
// // //     const message = `رمز التحقق الخاص بك لتطبيق إختصار هو: *${otpCode}*\n(صالح لمدة 5 دقائق).`;
    
// // //     // الإرسال المباشر عبر الواتساب
// // //     await sendWhatsAppMessage(formattedPhone, message);

// // //     res.json({ success: true, message: 'تم إرسال رمز التحقق عبر الواتساب بنجاح' });
// // //   } catch (err) {
// // //     console.error('WhatsApp Error:', err.message);
// // //     res.status(500).json({ message: 'فشل إرسال رسالة الواتساب، يرجى التأكد من تشغيل البوابة' });
// // //   }
// // // });

// // // // 2. التحقق من الرمز
// // // router.post('/verify-whatsapp-otp', async (req, res) => {
// // //   const { phone, code } = req.body;
// // //   if (!phone || !code) {
// // //     return res.status(400).json({ message: 'رقم الهاتف ورمز التحقق مطلوبان' });
// // //   }

// // //   let cleanPhone = phone.replace(/\D/g, '');
// // //   if (cleanPhone.startsWith('0')) {
// // //     cleanPhone = '964' + cleanPhone.slice(1);
// // //   } else if (!cleanPhone.startsWith('964')) {
// // //     cleanPhone = '964' + cleanPhone;
// // //   }
// // //   const formattedPhone = `+${cleanPhone}`;

// // //   const storedData = otpStore.get(formattedPhone);

// // //   if (!storedData) {
// // //     return res.status(400).json({ message: 'انتهت صلاحية الرمز أو لم يتم طلبه' });
// // //   }

// // //   if (Date.now() > storedData.expiresAt) {
// // //     otpStore.delete(formattedPhone);
// // //     return res.status(400).json({ message: 'انتهت صلاحية الرمز' });
// // //   }

// // //   if (storedData.code !== code.toString().trim()) {
// // //     return res.status(400).json({ message: 'رمز التحقق غير صحيح' });
// // //   }

// // //   otpStore.delete(formattedPhone);

// // //   res.json({ success: true, message: 'تم التحقق من الرمز بنجاح' });
// // // });

// // // // 3. مسار جديد لإرسال الإشعارات العامة عبر الواتساب (مثلاً: تأكيد حجز، تنبيه موعد، إلخ)
// // // router.post('/send-whatsapp-notification', async (req, res) => {
// // //   const { phone, notificationText } = req.body;

// // //   if (!phone || !notificationText) {
// // //     return res.status(400).json({ message: 'رقم الهاتف ونص الإشعار مطلوبان' });
// // //   }

// // //   try {
// // //     await sendWhatsAppMessage(phone, notificationText);
// // //     res.json({ success: true, message: 'تم إرسال الإشعار عبر الواتساب بنجاح' });
// // //   } catch (err) {
// // //     console.error('WhatsApp Notification Error:', err.message);
// // //     res.status(500).json({ message: 'فشل إرسال الإشعار عبر الواتساب' });
// // //   }
// // // });


// // // module.exports = router;
// // const express = require('express');
// // const router = express.Router();
// // const axios = require('axios');
// // const { sendWhatsAppMessage } = require('./whatsappService'); // خدمة الواتساب

// // // إعدادات منصة SMSGate
// // const SMSGATE_API_URL = 'https://api.sms-gate.app/3rdparty/v1/messages?skipPhoneValidation=true';
// // const SMSGATE_USERNAME = 'O8BNJ1';
// // const SMSGATE_PASSWORD = 'rgab4pqq1ec9s_';
// // const SMSGATE_DEVICE_ID = 'ROzngDINLb6tSzP0Uqu7k';

// // // تخزين رموز التحقق المؤقتة
// // const otpStore = new Map();

// // // دالة مساعدة لتنسيق أرقام الهواتف (لتوحيد الصيغة الدولية العراقية)
// // function formatPhoneNumber(phone) {
// //   if (!phone) return '';
// //   let cleanPhone = phone.replace(/\D/g, '');
// //   if (cleanPhone.startsWith('0')) {
// //     cleanPhone = '964' + cleanPhone.slice(1);
// //   } else if (!cleanPhone.startsWith('964')) {
// //     cleanPhone = '964' + cleanPhone;
// //   }
// //   return `+${cleanPhone}`;
// // }

// // // ==========================================
// // // أولاً: مسارات الواتساب (WhatsApp Routes)
// // // ==========================================

// // // 1. إرسال رمز التحقق (OTP) عبر الواتساب
// // router.post('/send-whatsapp-otp', async (req, res) => {
// //   const { phone } = req.body;
// //   if (!phone) return res.status(400).json({ message: 'رقم الهاتف مطلوب' });

// //   const formattedPhone = formatPhoneNumber(phone);
// //   const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

// //   otpStore.set(formattedPhone, {
// //     code: otpCode,
// //     expiresAt: Date.now() + 5 * 60 * 1000,
// //   });

// //   try {
// //     const message = `رمز التحقق الخاص بك لتطبيق إختصار هو: *${otpCode}*\n(صالح لمدة 5 دقائق).`;
// //     await sendWhatsAppMessage(formattedPhone, message);

// //     res.json({ success: true, message: 'تم إرسال رمز التحقق عبر الواتساب بنجاح' });
// //   } catch (err) {
// //     console.error('WhatsApp Error:', err.message);
// //     res.status(500).json({ message: 'فشل إرسال رسالة الواتساب، يرجى التأكد من تشغيل البوابة' });
// //   }
// // });

// // // 2. التحقق من رمز الواتساب
// // router.post('/verify-whatsapp-otp', async (req, res) => {
// //   const { phone, code } = req.body;
// //   if (!phone || !code) {
// //     return res.status(400).json({ message: 'رقم الهاتف ورمز التحقق مطلوبان' });
// //   }

// //   const formattedPhone = formatPhoneNumber(phone);
// //   const storedData = otpStore.get(formattedPhone);

// //   if (!storedData) {
// //     return res.status(400).json({ message: 'انتهت صلاحية الرمز أو لم يتم طلبه' });
// //   }

// //   if (Date.now() > storedData.expiresAt) {
// //     otpStore.delete(formattedPhone);
// //     return res.status(400).json({ message: 'انتهت صلاحية الرمز' });
// //   }

// //   if (storedData.code !== code.toString().trim()) {
// //     return res.status(400).json({ message: 'رمز التحقق غير صحيح' });
// //   }

// //   otpStore.delete(formattedPhone);
// //   res.json({ success: true, message: 'تم التحقق من الرمز بنجاح' });
// // });

// // // 3. إرسال الإشعارات العامة عبر الواتساب
// // router.post('/send-whatsapp-notification', async (req, res) => {
// //   const { phone, notificationText } = req.body;

// //   if (!phone || !notificationText) {
// //     return res.status(400).json({ message: 'رقم الهاتف ونص الإشعار مطلوبان' });
// //   }

// //   try {
// //     await sendWhatsAppMessage(phone, notificationText);
// //     res.json({ success: true, message: 'تم إرسال الإشعار عبر الواتساب بنجاح' });
// //   } catch (err) {
// //     console.error('WhatsApp Notification Error:', err.message);
// //     res.status(500).json({ message: 'فشل إرسال الإشعار عبر الواتساب' });
// //   }
// // });


// // // ==========================================
// // // ثانياً: مسارات الـ SMS (SMSGate Routes)
// // // ==========================================

// // // 4. إرسال رمز التحقق عبر SMSGate API
// // router.post('/send-sms-otp', async (req, res) => {
// //   const { phone } = req.body;
// //   if (!phone) return res.status(400).json({ message: 'رقم الهاتف مطلوب' });

// //   const formattedPhone = formatPhoneNumber(phone);
// //   const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

// //   otpStore.set(formattedPhone, {
// //     code: otpCode,
// //     expiresAt: Date.now() + 5 * 60 * 1000,
// //   });

// //   try {
// //     const credentials = Buffer.from(`${SMSGATE_USERNAME}:${SMSGATE_PASSWORD}`).toString('base64');

// //     const response = await axios.post(
// //       SMSGATE_API_URL,
// //       {
// //         deviceId: SMSGATE_DEVICE_ID,
// //         phoneNumbers: [formattedPhone],
// //         message: `Your Ictsar verification code is: ${otpCode} (Valid for 5 minutes).`
// //       },
// //       {
// //         headers: {
// //           'Authorization': `Basic ${credentials}`,
// //           'Content-Type': 'application/json'
// //         }
// //       }
// //     );

// //     console.log('SMSGate Response:', response.data);
// //     res.json({ success: true, message: 'تم إرسال رمز التحقق عبر SMS بنجاح' });
// //   } catch (err) {
// //     console.error('SMSGate Error:', err.response?.data || err.message);
// //     res.status(500).json({ message: 'فشل إرسال الرسالة، يرجى التحقق من اتصال هاتف الـ SMS بالإنترنت' });
// //   }
// // });

// // // 5. التحقق من رمز الـ SMS (يستخدم نفس الـ otpStore الموحد)
// // router.post('/verify-sms-otp', async (req, res) => {
// //   const { phone, code } = req.body;
// //   if (!phone || !code) {
// //     return res.status(400).json({ message: 'رقم الهاتف ورمز التحقق مطلوبان' });
// //   }

// //   const formattedPhone = formatPhoneNumber(phone);
// //   const storedData = otpStore.get(formattedPhone);

// //   if (!storedData) {
// //     return res.status(400).json({ message: 'انتهت صلاحية الرمز أو لم يتم طلبه' });
// //   }

// //   if (Date.now() > storedData.expiresAt) {
// //     otpStore.delete(formattedPhone);
// //     return res.status(400).json({ message: 'انتهت صلاحية الرمز' });
// //   }

// //   if (storedData.code !== code.toString().trim()) {
// //     return res.status(400).json({ message: 'رمز التحقق غير صحيح' });
// //   }

// //   otpStore.delete(formattedPhone);
// //   res.json({ success: true, message: 'تم التحقق من الرمز بنجاح' });
// // });

// // module.exports = router;
// const express = require('express');
// const router = express.Router();
// const axios = require('axios');
// const { sendWhatsAppMessage, getLatestQR, qrcode } = require('./whatsappService'); // استيراد دوال الواتساب

// // إعدادات منصة SMSGate
// const SMSGATE_API_URL = 'https://api.sms-gate.app/3rdparty/v1/messages?skipPhoneValidation=true';
// const SMSGATE_USERNAME = 'O8BNJ1';
// const SMSGATE_PASSWORD = 'rgab4pqq1ec9s_';
// const SMSGATE_DEVICE_ID = 'ROzngDINLb6tSzP0Uqu7k';

// // تخزين رموز التحقق المؤقتة
// const otpStore = new Map();

// // 1. دالة لتنسيق الرقم بالصيغة المحلية العادية (تبدأ بـ 07 للحفظ في النظام)
// function formatPhoneNumberForStorage(phone) {
//   if (!phone) return '';
//   let cleanPhone = phone.replace(/\D/g, '');
  
//   // إذا كان الرقم يبدأ برمز الدولة 964 وتحول إلى صيغة دولية، نحولها إلى 07 المحلية
//   if (cleanPhone.startsWith('964')) {
//     cleanPhone = '0' + cleanPhone.slice(3);
//   } else if (!cleanPhone.startsWith('0') && cleanPhone.length === 10) {
//     cleanPhone = '0' + cleanPhone;
//   }
//   return cleanPhone; // مثال: 07801234567
// }

// // 2. دالة لتنسيق الرقم بالشكل الدولي (لإرساله عبر API الواتساب والـ SMS)
// function formatPhoneNumberForAPI(phone) {
//   if (!phone) return '';
//   let cleanPhone = phone.replace(/\D/g, '');
//   if (cleanPhone.startsWith('0')) {
//     cleanPhone = '964' + cleanPhone.slice(1);
//   } else if (!cleanPhone.startsWith('964')) {
//     cleanPhone = '964' + cleanPhone;
//   }
//   return cleanPhone; // مثال: 9647801234567
// }

// // ==========================================
// // صفحة عرض الـ QR عبر المتصفح
// // ==========================================
// router.get('/whatsapp-qr', async (req, res) => {
//   const qr = getLatestQR();
//   if (!qr) {
//     return res.send('<h3>عذراً، لم يتم توليد QR جديد، أو أن الواتساب متصل بالفعل وحالة الجلسة نشطة.</h3>');
//   }
//   try {
//     const qrBuffer = await qrcode.toBuffer(qr);
//     res.setHeader('Content-Type', 'image/png');
//     res.send(qrBuffer);
//   } catch (err) {
//     res.status(500).send('حدث خطأ أثناء توليد صورة الـ QR');
//   }
// });

// // ==========================================
// // أولاً: مسارات الواتساب (WhatsApp Routes)
// // ==========================================

// // 1. إرسال رمز التحقق (OTP) عبر الواتساب
// router.post('/send-whatsapp-otp', async (req, res) => {
//   const { phone } = req.body;
//   if (!phone) return res.status(400).json({ message: 'رقم الهاتف مطلوب' });

//   const storagePhone = formatPhoneNumberForStorage(phone); // يحفظ بصيغة 07...
//   const apiPhone = formatPhoneNumberForAPI(phone);       // يرسل بصيغة 9647...
//   const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

//   otpStore.set(storagePhone, {
//     code: otpCode,
//     expiresAt: Date.now() + 5 * 60 * 1000,
//   });

//   try {
//     const message = `رمز التحقق الخاص بك لتطبيق إختصار هو: *${otpCode}*\n(صالح لمدة 5 دقائق).`;
//     await sendWhatsAppMessage(apiPhone, message);

//     res.json({ success: true, message: 'تم إرسال رمز التحقق عبر الواتساب بنجاح' });
//   } catch (err) {
//     console.error('WhatsApp Error:', err.message);
//     res.status(500).json({ message: 'فشل إرسال رسالة الواتساب، يرجى التأكد من تشغيل البوابة' });
//   }
// });

// // 2. التحقق من رمز الواتساب
// router.post('/verify-whatsapp-otp', async (req, res) => {
//   const { phone, code } = req.body;
//   if (!phone || !code) {
//     return res.status(400).json({ message: 'رقم الهاتف ورمز التحقق مطلوبان' });
//   }

//   const storagePhone = formatPhoneNumberForStorage(phone);
//   const storedData = otpStore.get(storagePhone);

//   if (!storedData) {
//     return res.status(400).json({ message: 'انتهت صلاحية الرمز أو لم يتم طلبه' });
//   }

//   if (Date.now() > storedData.expiresAt) {
//     otpStore.delete(storagePhone);
//     return res.status(400).json({ message: 'انتهت صلاحية الرمز' });
//   }

//   if (storedData.code !== code.toString().trim()) {
//     return res.status(400).json({ message: 'رمز التحقق غير صحيح' });
//   }

//   otpStore.delete(storagePhone);
//   res.json({ success: true, message: 'تم التحقق من الرمز بنجاح' });
// });

// // 3. إرسال الإشعارات العامة عبر الواتساب
// router.post('/send-whatsapp-notification', async (req, res) => {
//   const { phone, notificationText } = req.body;

//   if (!phone || !notificationText) {
//     return res.status(400).json({ message: 'رقم الهاتف ونص الإشعار مطلوبان' });
//   }

//   try {
//     const apiPhone = formatPhoneNumberForAPI(phone);
//     await sendWhatsAppMessage(apiPhone, notificationText);
//     res.json({ success: true, message: 'تم إرسال الإشعار عبر الواتساب بنجاح' });
//   } catch (err) {
//     console.error('WhatsApp Notification Error:', err.message);
//     res.status(500).json({ message: 'فشل إرسال الإشعار عبر الواتساب' });
//   }
// });


// // ==========================================
// // ثانياً: مسارات الـ SMS (SMSGate Routes)
// // ==========================================

// // 4. إرسال رمز التحقق عبر SMSGate API
// router.post('/send-sms-otp', async (req, res) => {
//   const { phone } = req.body;
//   if (!phone) return res.status(400).json({ message: 'رقم الهاتف مطلوب' });

//   const storagePhone = formatPhoneNumberForStorage(phone); // يحفظ بصيغة 07... في المخزن
//   const apiPhone = formatPhoneNumberForAPI(phone);       // يرسل بصيغة 9647... للـ API
//   const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

//   otpStore.set(storagePhone, {
//     code: otpCode,
//     expiresAt: Date.now() + 5 * 60 * 1000,
//   });

//   try {
//     const credentials = Buffer.from(`${SMSGATE_USERNAME}:${SMSGATE_PASSWORD}`).toString('base64');

//     const response = await axios.post(
//       SMSGATE_API_URL,
//       {
//         deviceId: SMSGATE_DEVICE_ID,
//         phoneNumbers: [apiPhone], // إرسال الرقم بالصيغة الدولية المطلوبة للبوابة
//         message: `Your Ictsar verification code is: ${otpCode} (Valid for 5 minutes).`
//       },
//       {
//         headers: {
//           'Authorization': `Basic ${credentials}`,
//           'Content-Type': 'application/json'
//         }
//       }
//     );

//     console.log('SMSGate Response:', response.data);
//     res.json({ success: true, message: 'تم إرسال رمز التحقق عبر SMS بنجاح' });
//   } catch (err) {
//     console.error('SMSGate Error:', err.response?.data || err.message);
//     res.status(500).json({ message: 'فشل إرسال الرسالة، يرجى التحقق من اتصال هاتف الـ SMS بالإنترنت' });
//   }
// });

// // 5. التحقق من رمز الـ SMS
// router.post('/verify-sms-otp', async (req, res) => {
//   const { phone, code } = req.body;
//   if (!phone || !code) {
//     return res.status(400).json({ message: 'رقم الهاتف ورمز التحقق مطلوبان' });
//   }

//   const storagePhone = formatPhoneNumberForStorage(phone);
//   const storedData = otpStore.get(storagePhone);

//   if (!storedData) {
//     return res.status(400).json({ message: 'انتهت صلاحية الرمز أو لم يتم طلبه' });
//   }

//   if (Date.now() > storedData.expiresAt) {
//     otpStore.delete(storagePhone);
//     return res.status(400).json({ message: 'انتهت صلاحية الرمز' });
//   }

//   if (storedData.code !== code.toString().trim()) {
//     return res.status(400).json({ message: 'رمز التحقق غير صحيح' });
//   }

//   otpStore.delete(storagePhone);
//   res.json({ success: true, message: 'تم التحقق من الرمز بنجاح' });
// });

// module.exports = router;
const express = require('express');
const router = express.Router();
const axios = require('axios');

// رابط خدمة الواتساب التي ستعمل على Termux (يتم وضعه في Vercel Environment Variables)
const WHATSAPP_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL; 

// إعدادات منصة SMSGate
const SMSGATE_API_URL = 'https://api.sms-gate.app/3rdparty/v1/messages?skipPhoneValidation=true';
const SMSGATE_USERNAME = 'O8BNJ1';
const SMSGATE_PASSWORD = 'rgab4pqq1ec9s_';
const SMSGATE_DEVICE_ID = 'ROzngDINLb6tSzP0Uqu7k';

// تخزين رموز التحقق المؤقتة
const otpStore = new Map();

// دالة لتنسيق الرقم بالصيغة المحلية العادية (07...)
function formatPhoneNumberForStorage(phone) {
  if (!phone) return '';
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('964')) {
    cleanPhone = '0' + cleanPhone.slice(3);
  } else if (!cleanPhone.startsWith('0') && cleanPhone.length === 10) {
    cleanPhone = '0' + cleanPhone;
  }
  return cleanPhone;
}

// دالة لتنسيق الرقم بالشكل الدولي (9647...)
function formatPhoneNumberForAPI(phone) {
  if (!phone) return '';
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '964' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('964')) {
    cleanPhone = '964' + cleanPhone;
  }
  return cleanPhone;
}

// ==========================================
// أولاً: مسارات الواتساب (WhatsApp Routes)
// ==========================================

// 1. إرسال رمز التحقق (OTP) عبر الواتساب
router.post('/send-whatsapp-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'رقم الهاتف مطلوب' });

  const storagePhone = formatPhoneNumberForStorage(phone);
  const apiPhone = formatPhoneNumberForAPI(phone);
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore.set(storagePhone, {
    code: otpCode,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  try {
    const message = `رمز التحقق الخاص بك لتطبيق إختصار هو: *${otpCode}*\n(صالح لمدة 5 دقائق).`;
    
    // إرسال الطلب إلى خدمة الواتساب المرفوعة على Termux
    await axios.post(`${WHATSAPP_SERVICE_URL}/send-message`, {
      phone: apiPhone,
      messageText: message
    });

    res.json({ success: true, message: 'تم إرسال رمز التحقق عبر الواتساب بنجاح' });
  } catch (err) {
    console.error('WhatsApp Error:', err.response?.data || err.message);
    res.status(500).json({ message: 'فشل إرسال رسالة الواتساب، يرجى التأكد من تشغيل البوابة على الهاتف' });
  }
});

// 2. التحقق من رمز الواتساب
router.post('/verify-whatsapp-otp', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ message: 'رقم الهاتف ورمز التحقق مطلوبان' });
  }

  const storagePhone = formatPhoneNumberForStorage(phone);
  const storedData = otpStore.get(storagePhone);

  if (!storedData) {
    return res.status(400).json({ message: 'انتهت صلاحية الرمز أو لم يتم طلبه' });
  }

  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(storagePhone);
    return res.status(400).json({ message: 'انتهت صلاحية الرمز' });
  }

  if (storedData.code !== code.toString().trim()) {
    return res.status(400).json({ message: 'رمز التحقق غير صحيح' });
  }

  otpStore.delete(storagePhone);
  res.json({ success: true, message: 'تم التحقق من الرمز بنجاح' });
});

// 3. إرسال الإشعارات العامة عبر الواتساب
router.post('/send-whatsapp-notification', async (req, res) => {
  const { phone, notificationText } = req.body;

  if (!phone || !notificationText) {
    return res.status(400).json({ message: 'رقم الهاتف ونص الإشعار مطلوبان' });
  }

  try {
    const apiPhone = formatPhoneNumberForAPI(phone);
    await axios.post(`${WHATSAPP_SERVICE_URL}/send-message`, {
      phone: apiPhone,
      messageText: notificationText
    });
    res.json({ success: true, message: 'تم إرسال الإشعار عبر الواتساب بنجاح' });
  } catch (err) {
    console.error('WhatsApp Notification Error:', err.message);
    res.status(500).json({ message: 'فشل إرسال الإشعار عبر الواتساب' });
  }
});

// ==========================================
// ثانياً: مسارات الـ SMS (SMSGate Routes)
// ==========================================
// نقطة نهاية لإرجاع وقت السيرفر الحقيقي
router.get('/server-time', (req, res) => {
    try {
        const currentTime = new Date();
        res.status(200).json({
            success: true,
            serverTime: currentTime.toISOString(), // صيغة ISO آمنة وموحدة للمقارنة
            timestamp: currentTime.getTime()      // طابع زمنية بالأرقام (Milliseconds) لسهولة الحساب
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'فشل في جلب وقت السيرفر'
        });
    }
});

router.post('/send-sms-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'رقم الهاتف مطلوب' });

  const storagePhone = formatPhoneNumberForStorage(phone);
  const apiPhone = formatPhoneNumberForAPI(phone);
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore.set(storagePhone, {
    code: otpCode,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  try {
    const credentials = Buffer.from(`${SMSGATE_USERNAME}:${SMSGATE_PASSWORD}`).toString('base64');

    const response = await axios.post(
      SMSGATE_API_URL,
      {
        deviceId: SMSGATE_DEVICE_ID,
        phoneNumbers: [apiPhone],
        message: `Your Ictsar verification code is: ${otpCode} (Valid for 5 minutes).`
      },
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ success: true, message: 'تم إرسال رمز التحقق عبر SMS بنجاح' });
  } catch (err) {
    console.error('SMSGate Error:', err.response?.data || err.message);
    res.status(500).json({ message: 'فشل إرسال الرسالة، يرجى التحقق من اتصال هاتف الـ SMS بالإنترنت' });
  }
});

router.post('/verify-sms-otp', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ message: 'رقم الهاتف ورمز التحقق مطلوبان' });
  }

  const storagePhone = formatPhoneNumberForStorage(phone);
  const storedData = otpStore.get(storagePhone);

  if (!storedData) {
    return res.status(400).json({ message: 'انتهت صلاحية الرمز أو لم يتم طلبه' });
  }

  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(storagePhone);
    return res.status(400).json({ message: 'انتهت صلاحية الرمز' });
  }

  if (storedData.code !== code.toString().trim()) {
    return res.status(400).json({ message: 'رمز التحقق غير صحيح' });
  }

  otpStore.delete(storagePhone);
  res.json({ success: true, message: 'تم التحقق من الرمز بنجاح' });
});

module.exports = router;