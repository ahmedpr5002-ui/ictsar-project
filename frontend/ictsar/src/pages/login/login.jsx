import React, { useState } from 'react';
import logo from '../../image/7725857__2_-removebg-preview.png';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/Auth';
import './login.css';
import { MdEmail } from "react-icons/md";
import { FaLock } from "react-icons/fa";

function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  function loginPage() {
    if (!email || !password) {
      setErrorMsg("يرجى ملء جميع الحقول المتاحة");
      return;
    }
    
    setErrorMsg("");
    setLoading(true);

    axios
      .post("http://localhost:3000/user/login", {
        email: email,
        password: password,
      })
      .then((response) => {
        if (response.data && response.data.token) {
          login(response.data.token);
          navigate('/');
        }
      })
      .catch((error) => {
        console.error(error);
        setErrorMsg(error.response?.data?.masege || "فشل تسجيل الدخول، تأكد من البيانات");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <div className="mobile-login-container">
      <div className="login-app-content">
        
       
        <div className="login-header-section">
          <div className="logo-wrapper">
            <img src={logo} alt="Logo" className="mobile-logo-img" />
          </div>
          <h2 className="login-welcome-title">مرحباً بك مجدداً</h2>
          <p className="login-subtitle">قم بتسجيل الدخول للمتابعة إلى حسابك</p>
        </div>

       
        {errorMsg && <div className="login-error-badge">{errorMsg}</div>}

  
        <form className="mobile-form-div" onSubmit={(e) => {
          e.preventDefault();
          loginPage();
        }}>
          
          <div className="mobile-input-group">
            <label htmlFor="emailInput">البريد الإلكتروني</label>
            <div className="input-with-icon">
              <span className="input-icon"><MdEmail/></span>
              <input 
                type="email" 
                id="emailInput" 
                placeholder="example@mail.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
          </div>

          <div className="mobile-input-group">
            <label htmlFor="passwordInput">كلمة المرور</label>
            <div className="input-with-icon">
              <span className="input-icon"><FaLock/></span>
              <input 
                type="password" 
                id="passwordInput" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
          </div>

          

         
          <button 
            type="submit" 
            className={`mobile-login-btn-submit ${loading ? 'btn-loading' : ''}`}
            disabled={loading}
          >
            {loading ? "جاري التحقق..." : "تسجيل الدخول"}
          </button>

        </form>

        <div className="login-footer-text">
        
          <p>ليس لديك حساب؟ <button style={{
            border:"0",
            backgroundColor:"transparent"
          }} onClick={()=>{
            navigate('/register');

          }}><span className="signup-highlight">إنشاء حساب جديد</span></button></p>
        </div>

      </div>
    </div>
  );
}

export default Login;