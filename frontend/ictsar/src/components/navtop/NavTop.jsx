import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../image/7725857__2_-removebg-preview.png';

function NavTop({ userImage }) {
  const navigate = useNavigate();
  
  // حالة محلية لإدارة رابط الصورة داخل المكون
  const [userImageUrl, setUserImageUrl] = useState(localStorage.getItem("image"));

  useEffect(() => {
    const handleImageUpdate = () => {
      setUserImageUrl(localStorage.getItem("image"));
    };

    window.addEventListener('imageUpdated', handleImageUpdate);

    return () => {
      window.removeEventListener('imageUpdated', handleImageUpdate);
    };
  }, []);

  // الترقيع الأضمن: يأخذ الـ Prop أولاً، ثم الحالة المحدثة، ثم الـ localStorage كخيار أخير
  const currentImage = userImage || userImageUrl || localStorage.getItem("image") || "https://via.placeholder.com/50";

  return (
    <div 
      style={{ 
        display: "flex", 
        width: "100%",            // جعلناها 100% لتغطي العرض كامل مع عمل padding داخلي
        padding: "0 2.5%",        // لتعويض الـ 95% السابقة وجعل العناصر متناسقة
        height: '8dvh', 
        justifyContent: "space-between", 
        alignItems: "center",
        position: "fixed",
        top: "0",
        left: "0",               // تثبيت الاتجاه من اليسار لضمان عدم تحرك الـ fixed
        zIndex: "100",
        
        // ✨ تأثير الخلفية الزجاجية (Glassmorphism)
        backgroundColor: "rgba(255, 255, 255, 0.05)", // خلفية بيضاء شفافة جداً تتماشى مع الثيم المظلم
        backdropFilter: "blur(10px)",                  // درجات التغبيش للزجاج
        WebkitBackdropFilter: "blur(10px)",            // لدعم متصفحات Safari
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)", // خط سفلي نحيف جداً ليعطي تأثير حافة الزجاج
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)"    // ظل ناعم بالأسفل ليبرز المكون عن المحتوى الخلفي
      }}
    >
      <div style={{ height: '8dvh', display: "flex", alignItems: "center" }} > {/* جعلنا الطول متناسق مع الأب 8dvh */}
        <img src={logo} alt="Logo" style={{ height: "70%" }} />
        <h1 style={{ fontFamily: "system-ui", color: "#00d4ff", marginLeft: "8px" }}>Ictsar</h1>
      </div>
      
      <img 
        src={currentImage} 
        onClick={() => { navigate('/profile') }} 
        alt="Profile" 
        style={{ 
          height: "45px", 
          width: "45px", 
          borderRadius: "50%",
          cursor: "pointer",
          objectFit: "cover",                        // لمنع تمدد أو تشوه صورة المستخدم
          border: "2px solid rgba(0, 212, 255, 0.5)", // إطار بلون مشروعك النيوني حول الصورة يعطي فخامة
          transition: "transform 0.2s ease"          // تأثير ناعم عند التفاعل
        }} 
      
        onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
        onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
      />
    </div>
  );
}

export default NavTop;