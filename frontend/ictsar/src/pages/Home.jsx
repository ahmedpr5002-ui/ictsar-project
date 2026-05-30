import Navbar from '../components/navbar/Navbar';
import Timer from '../components/timer/Timer'
import DateComponent from '../components/timer/Date'
import D from '../components/DoctorSelect/Doctor'
import logo from '../image/7725857__2_-removebg-preview.png'

import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/Auth';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import NavTop from '../components/navtop/NavTop';
import { useEffect, useState } from 'react';

function Home() {
  const notify = () => toast.error('كل البيانات مطلوبة');
  const notSuc = () => toast.success("تم الحجز بنجاح");
  const token = localStorage.getItem('token')
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [appointments, setAppointments] = useState([]);
  
 
  const [resetKey, setResetKey] = useState(0);

 
  const fetchAppointments = () => {
    axios.get('http://localhost:3000/Appointment/slot', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then((res) => {
      if (user && user.role === 'admin') {
        setAppointments(res.data); 
      }
    })
    .catch((e) => {
      console.log("Error fetching slots:", e);
    });
  };

  useEffect(() => {
    fetchAppointments();
  }, [user, token]);

  const handleCompleteAppointment = (id) => {
    axios.put(`http://localhost:3000/Appointment/slot/${id}`, {
      stat: "copcomplete" 
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then((res) => {
      toast.success("تم تحديث حالة الحجز إلى مكتمل");
      setAppointments(prev => 
        prev.map(app => app._id === id ? { ...app, stat: "copcomplete" } : app)
      );
    })
    .catch((err) => {
      console.error(err);
      toast.error("فشل تحديث حالة الحجز");
    });
  };

  const userImageUrl = localStorage.getItem("image");

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      flexDirection: "column",
      overflowX: "hidden",
      marginTop: "70px",
      backgroundColor: "#f8f9fa", 
      minHeight: "100vh",
      fontFamily: "sans-serif"
    }} >
      
      <NavTop userImage={userImageUrl} />
      <Navbar /> 

      {user && user.role !== 'admin' && (
        <div style={{ width: "100%", maxWidth: "450px", padding: "15px", boxSizing: "border-box" }}>
          
       
          <main key={resetKey} style={{display:"flex",alignItems:"center",flexDirection:"column"}}>
            <Timer/>
            <DateComponent/>
            <D/>
          </main>

          <button 
            style={{
              width: "100%", 
              margin: "20px 0", 
              padding: "14px", 
              borderRadius: "12px", 
              backgroundColor: "#00d4ff", 
              border: "none",
              cursor: "pointer",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "bold",
              boxShadow: "0 4px 10px rgba(0, 212, 255, 0.3)"
            }} 
            onClick={() => {
              const day = localStorage.getItem("day");
              const month = localStorage.getItem("month");
              const year = localStorage.getItem("year");
              const time = localStorage.getItem("time");
              const doctor = localStorage.getItem("doctor");
              const token = localStorage.getItem("token");

              if (!day || !month || !year || !time || !doctor) {
                notify();
                return; 
              }

              const formattedDate = `${day}/${month}/${year}`;

              axios.post("http://localhost:3000/Appointment/slot", {
                doctor: doctor,
                slot: time,
                date: formattedDate
              },{
                headers: {
                  Authorization: `Bearer ${token}` 
                }
              })
              .then((response) => {
                notSuc();
                
           
                localStorage.removeItem('time');
                localStorage.removeItem('doctor');
                localStorage.removeItem('year');
                localStorage.removeItem('month');
                localStorage.removeItem('day');
                
           
                setResetKey(prev => prev + 1);
              })
              .catch((error) => {
                if (error.response && error.response.data) {
                  console.error(error.response.data);
                } else {
                  console.error(error.message);
                }
                toast.error("فشل إرسال الحجز");
              });
            }}
          >
            إرسال الحجز الآن
          </button>
        </div>
      )}

      {/* لوحة التحكم للأدمن */}
      {user && user.role === 'admin' && (
        <div style={{ 
          width: "100%", 
          maxWidth: "480px", 
          padding: "20px 15px", 
          direction: "rtl",
          boxSizing: "border-box"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#2d3748", margin: 0 }}>الحجوزات الواردة</h2>
            <span style={{ backgroundColor: "#e2e8f0", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", color: "#4a5568" }}>
              {appointments.length} طلبات
            </span>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom:"70px"}}>
            {appointments.length > 0 ? (
              appointments.map((appointment) => (
                <div 
                  key={appointment._id} 
                  style={{ 
                    backgroundColor: "#ffffff", 
                    borderRadius: "16px", 
                    padding: "16px", 
                    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                    border: "1px solid #edf2f7",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <img 
                        src={`http://localhost:3000/${appointment.user?.image}`} 
                        alt={appointment.user?.username} 
                        style={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover", border: "2px solid #edf2f7" }}
                        onError={(e) => { e.target.src = logo }}
                      />
                      <div>
                        <h4 style={{ margin: "0 0 2px 0", color: "#1a202c", fontSize: "15px" }}>{appointment.user?.username}</h4>
                        <p style={{ margin: 0, color: "#718096", fontSize: "12px" }}>{appointment.user?.email}</p>
                      </div>
                    </div>
                    <span style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      color: "#fff",
                      backgroundColor: appointment.stat === "copcomplete" ? "#48bb78" : "#f56565"
                    }}>
                      {appointment.stat === "copcomplete" ? "مكتمل" : "معلق"}
                    </span>
                  </div>

                  <hr style={{ border: 0, borderTop: "1px solid #edf2f7", margin: 0 }} />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f7fafc", padding: "10px", borderRadius: "12px" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: "#a0aec0", display: "block" }}>الطبيب المعالج</span>
                      <strong style={{ fontSize: "13px", color: "#2d3748" }}>د. {appointment.doctor?.name}</strong>
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <span style={{ fontSize: "12px", color: "#4a5568", fontWeight: "600", display: "block" }}>{appointment.date}</span>
                      <span style={{ fontSize: "11px", color: "#00d4ff", fontWeight: "bold", direction: "ltr", display: "block" }}>{appointment.slot}</span>
                    </div>
                  </div>

                  {appointment.stat !== "copcomplete" && (
                    <button
                      onClick={() => handleCompleteAppointment(appointment._id)}
                      style={{
                        width: "100%",
                        padding: "10px",
                        backgroundColor: "#48bb78",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        marginTop: "5px",
                        boxShadow: "0 2px 6px rgba(72, 187, 120, 0.2)"
                      }}
                    >
                      ✓ تحديد كحجز مكتمل
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#a0aec0" }}>
                <p style={{ margin: 0, fontSize: "14px" }}>لا توجد حجوزات متاحة حالياً.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <Toaster containerStyle={{marginTop:"10px"}} />
    </div>
  );
}

export default Home;