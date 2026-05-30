import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/Auth';
import { useNavigate } from 'react-router-dom';
import { BiSolidImageAdd } from "react-icons/bi";
function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

 
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(''); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

 
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

  
    if (!imageFile) {
      setError('Profile image is required!');
      setLoading(false);
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }
try {
  const dataToSend = new FormData();

dataToSend.append('username', formData.username);
dataToSend.append('email', formData.email);
dataToSend.append('password', formData.password);


dataToSend.append('image', imageFile); 

const response = await fetch('http://localhost:3000/user/register', {
  method: 'POST',
  body: dataToSend, 
});


 
  const textData = await response.text(); 
  const data = textData ? JSON.parse(textData) : {};

  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }

  navigate('/login');

} catch (err) {
  setError(err.message);
  console.log(err)
} finally {
  setLoading(false);
}
  };

  if (user) return null;

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.subtitle}>Join us by creating a new account</p>
        
        {error && <div style={styles.error}>{error}</div>}

      
        <div style={styles.imageUploadSection}>
          <div 
            style={{
              ...styles.previewContainer,
              backgroundImage: imagePreview ? `url(${imagePreview})` : 'none'
            }}
            onClick={() => fileInputRef.current.click()} 
          >
            {!imagePreview && (
              <span style={styles.uploadPlaceholder}>
                <i><BiSolidImageAdd/></i>
                <span style={{ fontSize: '12px', marginTop: '4px' }}>Add Photo *</span>
              </span>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }} 
            required 
          />
          <p style={styles.imageTip}>Click the circle to upload profile picture</p>
        </div>

        {/* حقل اسم المستخدم */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            minLength={3}
            placeholder="e.g. alex_p"
            style={styles.input}
          />
        </div>

        {/* حقل البريد الإلكتروني */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="name@example.com"
            style={styles.input}
          />
        </div>

        {/* حقل كلمة المرور */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
            placeholder="At least 8 characters"
            style={styles.input}
          />
        </div>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Processing...' : 'Sign Up'}
        </button>
        <p style={{textAlign:"center"}}><h3 style={{color:"#00d4ff",display:"inline"}}
        onClick={()=>{
          
        }}
        >تسجيل الدخول</h3> لديك حساب؟</p>
      </form>
    </div>
  );
}

// التنسيقات الفاخرة بناءً على لوحة الألوان الخاصة بك وبأسلوب Modern Minimalist
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    padding: '20px'
  },
  form: {
    background: '#ffffff', // --nav-bg
    padding: '40px 35px',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)',
    border: '1px solid #edf2f7',
    width: '100%',
    maxWidth: '420px',
    boxSizing: 'border-box'
  },
  title: {
    margin: '0 0 5px 0',
    textAlign: 'center',
    color: '#1a202c',
    fontSize: '26px',
    fontWeight: '700'
  },
  subtitle: {
    margin: '0 0 30px 0',
    textAlign: 'center',
    color: '#75757a', // --text-muted
    fontSize: '14px'
  },
  imageUploadSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '25px'
  },
  previewContainer: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    border: '2px dashed #00d4ff', // --color-active
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0, 229, 255, 0.15)', // --shadow-color
    overflow: 'hidden'
  },
  uploadPlaceholder: {
    color: '#75757a', // --text-muted
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontWeight: '500'
  },
  imageTip: {
    fontSize: '12px',
    color: '#75757a', // --text-muted
    marginTop: '8px',
    textAlign: 'center'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#4a5568',
    fontSize: '14px',
    fontWeight: '600'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    boxSizing: 'border-box',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s ease',
    backgroundColor: '#f8fafc',
    ':focus': {
      border: '1px solid #00d4ff', // عند عمل فوكس تأخذ لون الـ active
      backgroundColor: '#fff'
    }
  },
  button: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #00ffaa 0%, #00e5ff 50%, #0088ff 100%)', // --gradient-logo التدرج المأخوذ من الشعار
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '15px',
    boxShadow: '0 4px 15px rgba(0, 229, 255, 0.3)',
    transition: 'transform 0.2s ease'
  },
  error: {
    backgroundColor: '#fff5f5',
    color: '#e53e3e',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    textAlign: 'center',
    border: '1px solid #fed7d7'
  }
};

export default Register;