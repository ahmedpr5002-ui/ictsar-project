// // // const express = require('express');
// // // const router = express.Router();
// // // const axios = require('axios');

// // // // إعدادات TextBee API الرسمية
// // // const TEXTBEE_API_URL = 'https://api.textbee.dev/api/v1/gateway/send-sms';
// // // const TEXTBEE_API_KEY = 'txb_fQARCe3oNG6Td8s8HXeZeJUb7MRe1clq';   
// // // const TEXTBEE_DEVICE_ID = '6acf7e7074e21da91adaab26';         

// // // const otpStore = new Map();

// // // // 1. إرسال رمز التحقق عبر TextBee API (نص إنجليزي لضمان عدم حدوث خطأ ترميز في الهاتف)
// // // router.post('/send-whatsapp-otp', async (req, res) => {
// // //   const { phone } = req.body;
// // //   if (!phone) return res.status(400).json({ message: 'رقم الهاتف مطلوب' });

// // //   // تنسيق الرقم بالصيغة الدولية
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
// // //     const response = await axios.post(
// // //       TEXTBEE_API_URL,
// // //       {
// // //         deviceId: TEXTBEE_DEVICE_ID,
// // //         recipients: [formattedPhone],
// // //         message: `Your Ictsar verification code is: ${otpCode} (Valid for 5 minutes).`,
// // //       },
// // //       {
// // //         headers: {
// // //           'x-api-key': TEXTBEE_API_KEY,
// // //           'Content-Type': 'application/json'
// // //         }
// // //       }
// // //     );

// // //     console.log('TextBee Response:', response.data);
// // //     res.json({ success: true, message: 'تم إرسال رمز التحقق بنجاح' });
// // //   } catch (err) {
// // //     console.error('TextBee Error:', err.response?.data || err.message);
// // //     res.status(500).json({ message: 'فشل إرسال الرسالة، يرجى المحاولة لاحقاً' });
// // //   }
// // // });

// // // // 2. التحقق من الرمز فقط بدون الحاجة لـ Firebase
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

// // //   // حذف الرمز بعد نجاح المطابقة
// // //   otpStore.delete(formattedPhone);

// // //   res.json({ success: true, message: 'تم التحقق من الرمز بنجاح' });
// // // });

// // // module.exports = router;
// // const express = require('express');
// // const router = express.Router();
// // const axios = require('axios');

// // // الإعدادات الصحيحة لمنصة SMSGate
// // const SMSGATE_API_URL = 'https://api.sms-gate.app/3rdparty/v1/messages?skipPhoneValidation=true';
// // const SMSGATE_USERNAME = 'O8BNJ1';
// // const SMSGATE_PASSWORD = 'rgab4pqq1ec9s_';
// // const SMSGATE_DEVICE_ID = 'ROzngDINLb6tSzP0Uqu7k';

// // const otpStore = new Map();

// // // 1. إرسال رمز التحقق عبر SMSGate API
// // router.post('/send-whatsapp-otp', async (req, res) => {
// //   const { phone } = req.body;
// //   if (!phone) return res.status(400).json({ message: 'رقم الهاتف مطلوب' });

// //   // تنسيق الرقم بالصيغة الدولية
// //   let cleanPhone = phone.replace(/\D/g, '');
// //   if (cleanPhone.startsWith('0')) {
// //     cleanPhone = '964' + cleanPhone.slice(1);
// //   } else if (!cleanPhone.startsWith('964')) {
// //     cleanPhone = '964' + cleanPhone;
// //   }
// //   const formattedPhone = `+${cleanPhone}`;

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
// //     res.json({ success: true, message: 'تم إرسال رمز التحقق بنجاح' });
// //   } catch (err) {
// //     console.error('SMSGate Error:', err.response?.data || err.message);
// //     res.status(500).json({ message: 'فشل إرسال الرسالة، يرجى التحقق من اتصال هاتف الـ SMS بالإنترنت' });
// //   }
// // });

// // // 2. التحقق من الرمز
// // router.post('/verify-whatsapp-otp', async (req, res) => {
// //   const { phone, code } = req.body;
// //   if (!phone || !code) {
// //     return res.status(400).json({ message: 'رقم الهاتف ورمز التحقق مطلوبان' });
// //   }

// //   let cleanPhone = phone.replace(/\D/g, '');
// //   if (cleanPhone.startsWith('0')) {
// //     cleanPhone = '964' + cleanPhone.slice(1);
// //   } else if (!cleanPhone.startsWith('964')) {
// //     cleanPhone = '964' + cleanPhone;
// //   }
// //   const formattedPhone = `+${cleanPhone}`;

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
// const { sendWhatsAppMessage } = require('./whatsappService'); // استدعاء دالة الإرسال

// const otpStore = new Map();

// // 1. إرسال رمز التحقق (OTP) عبر الواتساب
// router.post('/send-whatsapp-otp', async (req, res) => {
//   const { phone } = req.body;
//   if (!phone) return res.status(400).json({ message: 'رقم الهاتف مطلوب' });

//   // تنسيق الرقم
//   let cleanPhone = phone.replace(/\D/g, '');
//   if (cleanPhone.startsWith('0')) {
//     cleanPhone = '964' + cleanPhone.slice(1);
//   } else if (!cleanPhone.startsWith('964')) {
//     cleanPhone = '964' + cleanPhone;
//   }
//   const formattedPhone = `+${cleanPhone}`;

//   const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

//   otpStore.set(formattedPhone, {
//     code: otpCode,
//     expiresAt: Date.now() + 5 * 60 * 1000,
//   });

//   try {
//     const message = `رمز التحقق الخاص بك لتطبيق إختصار هو: *${otpCode}*\n(صالح لمدة 5 دقائق).`;
    
//     // الإرسال المباشر عبر الواتساب
//     await sendWhatsAppMessage(formattedPhone, message);

//     res.json({ success: true, message: 'تم إرسال رمز التحقق عبر الواتساب بنجاح' });
//   } catch (err) {
//     console.error('WhatsApp Error:', err.message);
//     res.status(500).json({ message: 'فشل إرسال رسالة الواتساب، يرجى التأكد من تشغيل البوابة' });
//   }
// });

// // 2. التحقق من الرمز
// router.post('/verify-whatsapp-otp', async (req, res) => {
//   const { phone, code } = req.body;
//   if (!phone || !code) {
//     return res.status(400).json({ message: 'رقم الهاتف ورمز التحقق مطلوبان' });
//   }

//   let cleanPhone = phone.replace(/\D/g, '');
//   if (cleanPhone.startsWith('0')) {
//     cleanPhone = '964' + cleanPhone.slice(1);
//   } else if (!cleanPhone.startsWith('964')) {
//     cleanPhone = '964' + cleanPhone;
//   }
//   const formattedPhone = `+${cleanPhone}`;

//   const storedData = otpStore.get(formattedPhone);

//   if (!storedData) {
//     return res.status(400).json({ message: 'انتهت صلاحية الرمز أو لم يتم طلبه' });
//   }

//   if (Date.now() > storedData.expiresAt) {
//     otpStore.delete(formattedPhone);
//     return res.status(400).json({ message: 'انتهت صلاحية الرمز' });
//   }

//   if (storedData.code !== code.toString().trim()) {
//     return res.status(400).json({ message: 'رمز التحقق غير صحيح' });
//   }

//   otpStore.delete(formattedPhone);

//   res.json({ success: true, message: 'تم التحقق من الرمز بنجاح' });
// });

// // 3. مسار جديد لإرسال الإشعارات العامة عبر الواتساب (مثلاً: تأكيد حجز، تنبيه موعد، إلخ)
// router.post('/send-whatsapp-notification', async (req, res) => {
//   const { phone, notificationText } = req.body;

//   if (!phone || !notificationText) {
//     return res.status(400).json({ message: 'رقم الهاتف ونص الإشعار مطلوبان' });
//   }

//   try {
//     await sendWhatsAppMessage(phone, notificationText);
//     res.json({ success: true, message: 'تم إرسال الإشعار عبر الواتساب بنجاح' });
//   } catch (err) {
//     console.error('WhatsApp Notification Error:', err.message);
//     res.status(500).json({ message: 'فشل إرسال الإشعار عبر الواتساب' });
//   }
// });


// module.exports = router;
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { sendWhatsAppMessage } = require('./whatsappService'); // خدمة الواتساب

// إعدادات منصة SMSGate
const SMSGATE_API_URL = 'https://api.sms-gate.app/3rdparty/v1/messages?skipPhoneValidation=true';
const SMSGATE_USERNAME = 'O8BNJ1';
const SMSGATE_PASSWORD = 'rgab4pqq1ec9s_';
const SMSGATE_DEVICE_ID = 'ROzngDINLb6tSzP0Uqu7k';

// تخزين رموز التحقق المؤقتة
const otpStore = new Map();

// دالة مساعدة لتنسيق أرقام الهواتف (لتوحيد الصيغة الدولية العراقية)
function formatPhoneNumber(phone) {
  if (!phone) return '';
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '964' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('964')) {
    cleanPhone = '964' + cleanPhone;
  }
  return `+${cleanPhone}`;
}

// ==========================================
// أولاً: مسارات الواتساب (WhatsApp Routes)
// ==========================================

// 1. إرسال رمز التحقق (OTP) عبر الواتساب
router.post('/send-whatsapp-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'رقم الهاتف مطلوب' });

  const formattedPhone = formatPhoneNumber(phone);
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore.set(formattedPhone, {
    code: otpCode,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  try {
    const message = `رمز التحقق الخاص بك لتطبيق إختصار هو: *${otpCode}*\n(صالح لمدة 5 دقائق).`;
    await sendWhatsAppMessage(formattedPhone, message);

    res.json({ success: true, message: 'تم إرسال رمز التحقق عبر الواتساب بنجاح' });
  } catch (err) {
    console.error('WhatsApp Error:', err.message);
    res.status(500).json({ message: 'فشل إرسال رسالة الواتساب، يرجى التأكد من تشغيل البوابة' });
  }
});

// 2. التحقق من رمز الواتساب
router.post('/verify-whatsapp-otp', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ message: 'رقم الهاتف ورمز التحقق مطلوبان' });
  }

  const formattedPhone = formatPhoneNumber(phone);
  const storedData = otpStore.get(formattedPhone);

  if (!storedData) {
    return res.status(400).json({ message: 'انتهت صلاحية الرمز أو لم يتم طلبه' });
  }

  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(formattedPhone);
    return res.status(400).json({ message: 'انتهت صلاحية الرمز' });
  }

  if (storedData.code !== code.toString().trim()) {
    return res.status(400).json({ message: 'رمز التحقق غير صحيح' });
  }

  otpStore.delete(formattedPhone);
  res.json({ success: true, message: 'تم التحقق من الرمز بنجاح' });
});

// 3. إرسال الإشعارات العامة عبر الواتساب
router.post('/send-whatsapp-notification', async (req, res) => {
  const { phone, notificationText } = req.body;

  if (!phone || !notificationText) {
    return res.status(400).json({ message: 'رقم الهاتف ونص الإشعار مطلوبان' });
  }

  try {
    await sendWhatsAppMessage(phone, notificationText);
    res.json({ success: true, message: 'تم إرسال الإشعار عبر الواتساب بنجاح' });
  } catch (err) {
    console.error('WhatsApp Notification Error:', err.message);
    res.status(500).json({ message: 'فشل إرسال الإشعار عبر الواتساب' });
  }
});


// ==========================================
// ثانياً: مسارات الـ SMS (SMSGate Routes)
// ==========================================

// 4. إرسال رمز التحقق عبر SMSGate API
router.post('/send-sms-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'رقم الهاتف مطلوب' });

  const formattedPhone = formatPhoneNumber(phone);
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore.set(formattedPhone, {
    code: otpCode,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  try {
    const credentials = Buffer.from(`${SMSGATE_USERNAME}:${SMSGATE_PASSWORD}`).toString('base64');

    const response = await axios.post(
      SMSGATE_API_URL,
      {
        deviceId: SMSGATE_DEVICE_ID,
        phoneNumbers: [formattedPhone],
        message: `Your Ictsar verification code is: ${otpCode} (Valid for 5 minutes).`
      },
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('SMSGate Response:', response.data);
    res.json({ success: true, message: 'تم إرسال رمز التحقق عبر SMS بنجاح' });
  } catch (err) {
    console.error('SMSGate Error:', err.response?.data || err.message);
    res.status(500).json({ message: 'فشل إرسال الرسالة، يرجى التحقق من اتصال هاتف الـ SMS بالإنترنت' });
  }
});

// 5. التحقق من رمز الـ SMS (يستخدم نفس الـ otpStore الموحد)
router.post('/verify-sms-otp', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ message: 'رقم الهاتف ورمز التحقق مطلوبان' });
  }

  const formattedPhone = formatPhoneNumber(phone);
  const storedData = otpStore.get(formattedPhone);

  if (!storedData) {
    return res.status(400).json({ message: 'انتهت صلاحية الرمز أو لم يتم طلبه' });
  }

  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(formattedPhone);
    return res.status(400).json({ message: 'انتهت صلاحية الرمز' });
  }

  if (storedData.code !== code.toString().trim()) {
    return res.status(400).json({ message: 'رمز التحقق غير صحيح' });
  }

  otpStore.delete(formattedPhone);
  res.json({ success: true, message: 'تم التحقق من الرمز بنجاح' });
});

module.exports = router;