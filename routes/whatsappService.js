// const qrcode = require('qrcode');

// let sock = null;

// async function connectToWhatsApp() {
//     // الاستيراد الديناميكي لحزمة Baileys (الحل الأساسي لمشكلة ERR_REQUIRE_ESM)
//     const baileys = await import('@whiskeysockets/baileys');
//     const makeWASocket = baileys.default;
//     const useMultiFileAuthState = baileys.useMultiFileAuthState;
//     const DisconnectReason = baileys.DisconnectReason;

//     const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

//     sock = makeWASocket({
//         auth: state,
//         printQRInTerminal: false
//     });

//     sock.ev.on('creds.update', saveCreds);

//     sock.ev.on('connection.update', async (update) => {
//         const { connection, lastDisconnect, qr } = update;

//         if (qr) {
//             console.log('\n--- جاري توليد كود الـ QR كصورة ---');
//             try {
//                 console.log(await qrcode.toString(qr, { type: 'terminal', small: true }));
//                 await qrcode.toFile('qrcode.png', qr);
//                 console.log('✅ تم حفظ كود الـ QR في ملف باسم qrcode.png، يمكنك فتحه ومسحه فوراً!');
//             } catch (err) {
//                 console.error('فشل توليد الـ QR:', err);
//             }
//         }

//         if (connection === 'close') {
//             const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
//             if (shouldReconnect) {
//                 connectToWhatsApp();
//             }
//         } else if (connection === 'open') {
//             console.log('✅ تم الاتصال بنجاح بـ WhatsApp API!');
//         }
//     });
// }

// async function sendWhatsAppMessage(phone, messageText) {
//     if (!sock) {
//         throw new Error('خدمة الواتساب غير متصلة حالياً');
//     }

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
const qrcode = require('qrcode');

let sock = null;
let latestQR = null; // متغير لحفظ آخر QR تم توليده لعرضه عبر المتصفح

async function connectToWhatsApp() {
    const baileys = await import('@whiskeysockets/baileys');
    const makeWASocket = baileys.default;
    const useMultiFileAuthState = baileys.useMultiFileAuthState;
    const DisconnectReason = baileys.DisconnectReason;

    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            latestQR = qr; // حفظ الـ QR مؤقتاً
            console.log('\n--- جاري توليد كود الـ QR ---');
            try {
                console.log(await qrcode.toString(qr, { type: 'terminal', small: true }));
                await qrcode.toFile('qrcode.png', qr);
                console.log('✅ تم حفظ كود الـ QR في ملف qrcode.png');
            } catch (err) {
                console.error('فشل توليد الـ QR:', err);
            }
        }

        if (connection === 'close') {
            latestQR = null;
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            latestQR = null; // تفريغ الـ QR عند الاتصال الناجح
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

module.exports = { 
    connectToWhatsApp, 
    sendWhatsAppMessage, 
    getLatestQR: () => latestQR, 
    qrcode 
};