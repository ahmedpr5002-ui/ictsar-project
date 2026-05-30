import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Auth';
import axios from "axios";

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  // حالة للتحكم في الإشعارات العصرية (Toast)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // دالة لإظهار الإشعار العصري تلقائياً ثم إخفائه
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000); // يختفي بعد 4 ثوانٍ
  };
 
  useEffect(() => {
    if (!user?.id) return; 

    setLoading(true);

    // تحديد الرابط بناءً على دور المستخدم (ادمن أم مستخدم عادي)
    // ملاحظة: قم بتعديل رابط الـ admin الافتراضي هنا ليطابق الـ API الخاص بك في الخلفية
    const apiUrl = user.role === 'admin' 
      ? `http://localhost:3000/Appointment/slot`  // رابط جلب كل الحجوزات للأدمن
      : `http://localhost:3000/Appointment/slot/${user.id}`; // رابط جلب حجوزات اليوزر المحدود

    axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then((res) => {
      setAppointments(res.data || []);
      setLoading(false);
    })
    .catch((e) => {
      console.log("Error fetching appointments:", e);
      if (e.response && e.response.status === 404) {
        setAppointments([]); 
      } else {
        showToast("حدث خطأ أثناء جلب البيانات، يرجى المحاولة لاحقاً.", "error");
      }
      setLoading(false);
    });
    
  }, [user?.id, user?.role]); // أضفنا user.role كمراقب لضمان التحديث عند تغير الصلاحية

  // دالة الحذف المحدثة مع الإشعار العصري والتحديث اللحظي
  const handleCancelAppointment = (appointmentId) => {
    axios.delete(`http://localhost:3000/Appointment/slot/${appointmentId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then((res) => {
      // تحديث القائمة فوراً في الواجهة
      setAppointments(prev => prev.filter(app => app._id !== appointmentId));
      showToast("تم إلغاء الحجز بنجاح", "success");
    })
    .catch((e) => {
      console.log("Error deleting appointment:", e);
      showToast("فشل إلغاء الحجز، يرجى المحاولة مرة أخرى", "error");
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg font-semibold text-gray-600">جاري تحميل المواعيد...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl" style={{marginTop:"70px" }}>
      
      {toast.show && (
        <div className={`fixed bottom-5 left-5 z-50 flex items-center p-4 rounded-xl shadow-lg border text-sm font-medium animate-bounce min-w-[250px] transition-all duration-300 ${
          toast.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span className="ml-2">
            {toast.type === 'success' ? '✓' : '⚠️'}
          </span>
          {toast.message}
        </div>
      )}

      <div className="max-w-6xl mx-auto" >
        
        <div className="flex justify-between items-center mb-8 border-b pb-4" >
          <h1 className="text-2xl font-bold text-gray-800">
            {user?.role === 'admin' ? "لوحة تحكم الإدارة - كل الحجوزات" : "جدول المواعيد المحجوزة"}
          </h1>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
            إجمالي المواعيد: {appointments.length}
          </span>
        </div>

        {/* واجهة في حال عدم وجود مواعيد */}
        {appointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center" >
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-bold text-gray-700 mb-1">لا توجد مواعيد محجوزة</h3>
            <p className="text-gray-500 text-sm">
              {user?.role === 'admin' ? "لا توجد أي حجوزات مسجلة في النظام حالياً." : "لم تقم بحجز أي موعد حتى الآن."}
            </p>
          </div>
        ) : (
          /* شبكة عرض المواعيد */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{marginBottom:"70px"}}>
            {appointments.map((appointment) => {
              const isCompleted = appointment.stat === 'complete' || appointment.stat === 'copcomplete';

              return (
                <div 
                  key={appointment._id} 
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 overflow-hidden"
                >
                  {/* شريط الحالة العلوي */}
                  <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500">
                      رقم الموعد: {appointment._id}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {isCompleted ? 'مكتمل' : 'قيد الانتظار'}
                    </span>
                  </div>

                  {/* تفاصيل الموعد */}
                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">الطبيب المعالج</p>
                      <h3 className="text-lg font-bold text-gray-800 mt-0.5">{appointment.doctor?.name || "اسم غير متوفر"}</h3>
                      {appointment.doctor?.specialty && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">
                          {appointment.doctor.specialty}
                        </span>
                      )}
                    </div>

                    <hr className="border-gray-100" />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 font-medium">اسم المريض</p>
                        <p className="text-sm font-semibold text-gray-700 mt-0.5">{appointment.user?.username || "اسم غير متوفر"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">التاريخ</p>
                        <p className="text-sm font-semibold text-gray-700 mt-0.5">{appointment.date}</p>
                      </div>
                    </div>

                    <div className="bg-blue-50/50 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">التوقيت المحجوز:</span>
                      <span className="text-sm font-bold text-blue-700">{appointment.slot}</span>
                    </div>
                  </div>

                  <div className="px-5 pb-4 pt-2 flex gap-2">
                    <button 
                      className={`text-sm font-medium py-2 px-4 rounded-lg transition-colors ${
                        isCompleted 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100' 
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                      style={{ width: "90%", margin: '0 auto' }}
                      disabled={isCompleted}
                      onClick={() => handleCancelAppointment(appointment._id)}
                    >
                      {user?.role === 'admin' ? "إلغاء الموعد (أدمن)" : "الغاء الحجز"}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}