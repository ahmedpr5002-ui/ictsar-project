import React, { useState } from 'react';
// استخدام أيقونات Lucide-React لمظهر عصري ونظيف
import { Home, User, Calendar, Phone, MessageCircle, FileText, ChevronDown, HelpCircle, ShieldCheck } from 'lucide-react';

const ContactUsPage = () => {
 
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    { q: "كيف أقوم بإلغاء أو تعديل موعدي؟", a: "يمكنك ذلك بسهولة من خلال الذهاب لتبويب المواعيد، واختيار الموعد المراد تعديله ثم الضغط على إلغاء أو تغيير الوقت." },
    { q: "كم يستغرق رد الطبيب على الاستشارة؟", a: "في العادة يتم الرد خلال مدة لا تتجاوز 30 دقيقة من وقت الحجز المعتمد." }
  ];

  return (
    <div className="w-full max-w-[412px] h-[846px] bg-slate-50 rounded-3xl shadow-2xl relative flex flex-col justify-between overflow-hidden font-sans" dir="rtl" style={{marginTop:"10dvh"}}>
      
   
      <div className="absolute top-0 left-0 right-0 h-44 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-b-[2.5rem] z-0"  />

  

    
      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6 space-y-5 relative z-10">
        
       
        <div className="text-white pb-2 pr-1">
          <h2 className="text-xl font-bold">مرحباً بك، كيف يمكننا توجيهك؟</h2>
          <p className="text-xs text-cyan-100 mt-1 font-light">اختر الوسيلة الأنسب لك لحل مشكلتك بسرعة</p>
        </div>

        {/* القسم 1: بطاقات الاتصال الفوري الجذابة */}
        <div className="space-y-3">
          <a href="https://wa.me/964000000000" target="_blank" rel="noopener noreferrer" 
             className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-green-300 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center text-green-600 group-hover:scale-105 transition-transform">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-850">المحادثة الفورية عبر الواتساب</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">متواجدون الآن للرد على استفساراتكم</p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-1 rounded-md">نشط</span>
          </a>

          <a href="tel:+964000000000" 
             className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-cyan-300 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 group-hover:scale-105 transition-transform" style={{background:"#61daf3"}}>
                <Phone  className="w-5 h-5" style={{color:"#fff"}}  />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-850">الاتصال الهاتفي المباشر</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">رقم موحد لكافة المحافظات والعيادات</p>
              </div>
            </div>
            <span className="text-[10px] font-bold  text-green-700 px-2 py-1 rounded-md" style={{backgroundColor:"#61daf3",color:"#fff"}}>اتصال</span>
          </a>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-gray-50">
            <HelpCircle className="w-4 h-4 text-cyan-500" />
            <h3 className="text-xs font-bold text-gray-700">أسئلة قد تهمك قبل الاتصال</h3>
          </div>

          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-50 last:border-none pb-2 last:pb-0">
              <button 
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex justify-between items-center py-1.5 text-right text-xs font-semibold text-gray-600 hover:text-cyan-600 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${openFaq === index ? 'rotate-180 text-cyan-500' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-20 mt-1' : 'max-h-0'}`}>
                <p className="text-[11px] text-gray-400 bg-slate-50 p-2.5 rounded-lg leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>

      

        {/* حماية الخصوصية والأمان في الأسفل كعنصر موثوقية للمريض */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 pt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>جميع بيانات اتصالك واستفساراتك مشفرة وآمنة تماماً</span>
        </div>

      </div>


    </div>
  );
};

export default ContactUsPage;