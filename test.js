import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 5 },  // تصعد تدريجياً لـ 5 مستخدمين
    { duration: '15s', target: 15 }, // تصعد لـ 15 مستخدم
    { duration: '15s', target: 25 }, // تصعد للذروة 25 مستخدم
    { duration: '10s', target: 0 },  // النزول التدريجي وإيقاف الضغط
  ],
};

export default function () {
  const url = 'https://ahmedpr5002-ictsar.hf.space/user/login';
  
  // 1. تجهيز البيانات وتحويلها لصيغة JSON نصية
  const payload = JSON.stringify({
    email: "ahmeds1010@gmail.com",
    password: "1111"
  });

  // 2. تحديد الهيدر لتخبر السيرفر أنك ترسل JSON
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // 3. إرسال الطلب بشكل صحيح
  http.post(url, payload, params);

  sleep(1);
}