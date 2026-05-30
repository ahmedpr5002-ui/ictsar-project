import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/Auth'; // تأكد من ضبط المسار حسب مشروعك

function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth(); 

  useEffect(() => {
    fetch('http://localhost:3000/doctor/Doctors')
      .then((res) => {
        if (!res.ok) throw new Error('فشل في جلب بيانات الأطباء');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setDoctors(data);
        else if (data && Array.isArray(data.doctors)) setDoctors(data.doctors);
        else if (data && Array.isArray(data.data)) setDoctors(data.data);
        else setDoctors([]);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const getDoctorImage = (imgSource) => {
    if (!imgSource || imgSource.trim() === "") {
      return "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80";
    }
    if (imgSource.startsWith('http://') || imgSource.startsWith('https://')) {
      return imgSource;
    }
    return `http://localhost:3000${imgSource.startsWith('/') ? '' : '/'}${imgSource}`;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="tech-spinner" style={styles.spinner}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <p style={{ margin: 0, fontWeight: '600' }}>⚠️ حدث خطأ: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper} dir="rtl">
      <div style={styles.container}>
        
        {/* الهيدر مع زر إضافة طبيب للأدمن */}
        <div style={styles.headerSection}>
          <h1 style={styles.title}>
            طاقم الأطباء <span style={{ color: '#00d4ff' }}>المتميزين</span>
          </h1>
        
          
          {user?.role === 'admin' && (
            <div style={{ marginTop: '20px' }}>
              <button 
                onClick={() => navigate('/newdoctor')}
                style={styles.adminButton}
              >
                + إضافة طبيب جديد
              </button>
            </div>
          )}
        </div>

        {!Array.isArray(doctors) || doctors.length === 0 ? (
          <div style={styles.noDataCard}>
            <p style={styles.noDataText}>لا يوجد أطباء متاحين في الوقت الحالي.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {doctors.map((doctor) => (
              <div key={doctor._id} className="tech-card" style={styles.card}>
                <div style={styles.imageContainer}>
                  <img 
                    src={getDoctorImage(doctor.image)} 
                    alt={doctor.name} 
                    style={styles.image} 
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                  <span style={styles.specialtyBadge}>{doctor.specialty || "ممارس عام"}</span>
                </div>

                <div style={styles.cardBody}>
                  <h2 style={styles.doctorName}>د. {doctor.name}</h2>
                  <div style={styles.expTag}>
                    <span style={{ color: '#00d4ff', fontWeight: '700' }}>{doctor.expier || 0}</span> سنوات خبرة
                  </div>
                  <p style={styles.description} title={doctor.des}>
                    {doctor.des || "لا يوجد وصف متاح مضاف حالياً لملف هذا الطبيب المتميز."}
                  </p>
                  <div style={styles.footerRow}>
                    <button className="tech-btn" style={styles.button} onClick={() => navigate('/')}>
                      حجز موعد الاستشارة
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: { backgroundColor: '#f9fbfc', minHeight: '100vh', width: '100%', fontFamily: 'system-ui, sans-serif', paddingBottom: '80px', margin: "30px 0 0 0" },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '60px 20px' },
  headerSection: { textAlign: 'center', marginBottom: '50px' },
  title: { color: '#1e293b', fontSize: '2.4rem', fontWeight: '800', margin: '0 0 12px 0' },
  subtitle: { color: '#64748b', fontSize: '1.1rem', margin: 0, maxWidth: '600px', lineHeight: '1.6', display: 'inline-block' },
  adminButton: { backgroundColor: '#00d4ff', color: '#1e293b', border: 'none', padding: '10px 25px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' },
  card: { backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)', overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' },
  imageContainer: { height: '240px', backgroundColor: '#f1f5f9', position: 'relative', borderBottom: '3px solid #00d4ff' },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  specialtyBadge: { position: 'absolute', bottom: '12px', right: '12px', backgroundColor: '#1e293b', color: '#ffffff', padding: '5px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600' },
  cardBody: { padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1 },
  doctorName: { fontSize: '1.3rem', fontWeight: '700', margin: '0 0 6px 0', color: '#1e293b' },
  expTag: { fontSize: '0.85rem', color: '#64748b', marginBottom: '14px' },
  description: { color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 20px 0', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '64px' },
  footerRow: { marginTop: 'auto' },
  button: { width: '100%', backgroundColor: '#1e293b', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600', transition: 'all 0.2s ease', borderBottom: '2px solid #00d4ff' },
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f9fbfc' },
  spinner: { width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTop: '3px solid #00d4ff', borderRadius: '50%' },
  errorContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f9fbfc' },
  errorCard: { backgroundColor: '#fef2f2', color: '#ef4444', padding: '16px 28px', borderRadius: '12px', border: '1px solid #fee2e2' },
  noDataCard: { textAlign: 'center', backgroundColor: '#ffffff', padding: '40px 20px', borderRadius: '16px', border: '1px solid #e2e8f0', maxWidth: '400px', margin: '0 auto' },
  noDataText: { color: '#64748b', fontSize: '1rem', margin: 0 }
};

// Injection of keyframes and hover effects
if (typeof document !== 'undefined') {
  const styleSheet = document.styleSheets[0] || document.head.appendChild(document.createElement('style')).sheet;
  try {
    styleSheet.insertRule(`@keyframes tech-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`.tech-spinner { animation: tech-spin 0.7s linear infinite; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`.tech-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0, 212, 255, 0.08); border-color: #00d4ff; }`, styleSheet.cssRules.length);
    styleSheet.insertRule(`.tech-btn:hover { background-color: #00d4ff !important; color: #1e293b !important; font-weight: 700; }`, styleSheet.cssRules.length);
  } catch (e) {}
}

export default Doctors;