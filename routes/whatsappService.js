// const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
// const qrcode = require('qrcode-terminal');

// let sock = null;

// async function connectToWhatsApp() {
//     // حفظ الجلسة محلياً لكي لا تطلب مسح QR في كل مرة يعيد فيها السيرفر التشغيل
//     const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

//     sock = makeWASocket({
//         auth: state,
//         printQRInTerminal: false
//     });

//     sock.ev.on('creds.update', saveCreds);

//     sock.ev.on('connection.update', (update) => {
//         const { connection, lastDisconnect, qr } = update;

//         if (qr) {
//             console.log('\n--- امسح كود الـ QR التالي عبر الواتساب للربط ---');
//             qrcode.generate(qr, { small: true });
//         }

//         if (connection === 'close') {
//             const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
//             console.log('تم قطع الاتصال بالواتساب، جاري الإعادة...', shouldReconnect);
//             if (shouldReconnect) {
//                 connectToWhatsApp();
//             }
//         } else if (connection === 'open') {
//             console.log('✅ تم الاتصال بنجاح بـ WhatsApp API الذاتي!');
//         }
//     });
// }

// // دالة عامة لإرسال أي رسالة عبر الواتساب (سواء OTP أو إشعار)
// async function sendWhatsAppMessage(phone, messageText) {
//     if (!sock) {
//         throw new Error('خدمة الواتساب غير متصلة حالياً');
//     }

//     // تنسيق الرقم لصيغة الواتساب الدولية بدون '+' ومتبوعة بـ @s.whatsapp.net
//     let cleanPhone = phone.replace(/\D/g, '');
//     if (cleanPhone.startsWith('0')) {
//         cleanPhone = '964' + cleanPhone.slice(1);
//     } else if (!cleanPhone.startsWith('964')) {
//         cleanPhone = '964' + cleanPhone;
//     }

//     const jid = `${cleanPhone}@s.whatsapp.net`;
//     await sock.sendMessage(jid, { text: messageText });
// }

// module.exports = { connectToWhatsApp, sendWhatsAppMessage };
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode'); // استيراد مكتبة الـ qrcode

let sock = null;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false // إلغاء الطباعة الكبيرة في التيرمينال
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n--- جاري توليد كود الـ QR كصورة ---');
            try {
                // طباعة رابط QR في التيرمينال أو حفظه كصورة
                console.log(await qrcode.toString(qr, { type: 'terminal', small: true }));
                
                // أو حفظه كصورة qrcode.png لفتحها برؤية واضحة جداً
                await qrcode.toFile('qrcode.png', qr);
                console.log('✅ تم حفظ كود الـ QR في ملف باسم qrcode.png، يمكنك فتحه ومسحه فوراً!');
            } catch (err) {
                console.error('فشل توليد الـ QR:', err);
            }
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✅ تم الاتصال بنجاح بـ WhatsApp API!');
        }
    });
}

async function sendWhatsAppMessage(phone, messageText) {
    if (!sock) {
        throw new Error('خدمة الواتساب غير متصلة حالياً');
    }

    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '964' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('964')) {
        cleanPhone = '964' + cleanPhone;
    }

    const jid = `${cleanPhone}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: messageText });
}

module.exports = { connectToWhatsApp, sendWhatsAppMessage };