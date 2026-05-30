import React from 'react';
import { useAuth } from '../../context/Auth';
import './profile.css';
import { FaLock } from "react-icons/fa";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="app-container">
        <div className="error-screen">
          <div className="error-icon" style={{color:"#00d4ff"}}><FaLock/></div>
          <h2>برجاء تسجيل الدخول</h2>
          <p>يجب تسجيل الدخول أولاً للوصول إلى ملفك الشخصي</p>
        </div>
      </div>
    );
  }

  const serverUrl = "http://localhost:3000/";
  const userImageUrl = user.image 
    ? `${serverUrl}${user.image.replace(/\\/g, '/')}` 
    : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

    localStorage.setItem("image",userImageUrl)
   

  return (
    <div className="app-container">
      
      <div className="app-header">
        <button className="header-back-btn">⚡</button>
        <h1 className="header-title">الملف الشخصي</h1>
        <div className="header-spacer"></div>
        <button className="header-back-btn" onClick={()=>{
          navigate('/')

        }}><FaArrowLeft/></button>
      </div>

      <div className="app-content">
      
        <div className="mobile-profile-card">
          <div className="avatar-ring">
            <img src={userImageUrl} alt="User Avatar" className="mobile-avatar" />
          </div>
          <h2 className="mobile-username">{user.username || "اسم المستخدم"}</h2>
          <p className="mobile-email">{user.email || "example@mail.com"}</p>
          {user.role && <span className="mobile-badge-role">{user.role}</span>}
        </div>

        <div className="menu-section">
          <p className="section-title">بيانات الحساب</p>
          
          <div className="menu-list">
            <div className="menu-item">
              <div className="menu-item-left">
                <span className="menu-icon">🆔</span>
                <span className="menu-label">معرف الحساب</span>
              </div>
              <span className="menu-value">{user.id || "غير معرف"}</span>
            </div>

            <div className="menu-item">
              <div className="menu-item-left">
                <span className="menu-icon">🛡️</span>
                <span className="menu-label">حالة الحساب</span>
              </div>
              <span className="menu-value status-tag">نشط</span>
            </div>
          </div>
        </div>

     

      
        <button className="mobile-logout-btn" onClick={logout}>
         logout
        </button>
      </div>
    </div>
  );
}

export default Profile;