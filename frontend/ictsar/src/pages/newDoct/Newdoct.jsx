import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiSolidImageAdd } from "react-icons/bi";

function AddDoctor() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    des: '',
    expier: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  // احصل على التوكين من التخزين المحلي
  const token = localStorage.getItem('token'); 

  try {
    const dataToSend = new FormData();
    dataToSend.append('name', formData.name);
    dataToSend.append('specialty', formData.specialty);
    dataToSend.append('des', formData.des);
    dataToSend.append('expier', formData.expier);
    dataToSend.append('image', imageFile);

    const response = await fetch('http://localhost:3000/doctor/Doctor', {
      method: 'POST',
      headers: {
        // أضف التوكين هنا للتحقق من هويتك
        'Authorization': `Bearer ${token}` 
      },
      body: dataToSend,
    });

    // لا تقم بـ JSON.parse إذا كان الرد ليس JSON
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'فشل في إضافة الطبيب');
    }

    alert("تم إضافة الطبيب بنجاح!");
    navigate('/doctors');

  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>إضافة طبيب جديد</h2>
        
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.imageUploadSection}>
          <div 
            style={{ ...styles.previewContainer, backgroundImage: imagePreview ? `url(${imagePreview})` : 'none' }}
            onClick={() => fileInputRef.current.click()}
          >
            {!imagePreview && (
              <span style={styles.uploadPlaceholder}>
                <BiSolidImageAdd size={30}/>
                <span style={{ fontSize: '12px' }}>صورة الطبيب</span>
              </span>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
        </div>

        {[
          { label: 'اسم الطبيب', name: 'name', type: 'text' },
          { label: 'التخصص', name: 'specialty', type: 'text' },
          { label: 'سنوات الخبرة', name: 'expier', type: 'number' }
        ].map((field) => (
          <div style={styles.inputGroup} key={field.name}>
            <label style={styles.label}>{field.label}</label>
            <input type={field.type} name={field.name} value={formData[field.name]} onChange={handleChange} required style={styles.input} />
          </div>
        ))}

        <div style={styles.inputGroup}>
          <label style={styles.label}>الوصف</label>
          <textarea name="des" value={formData.des} onChange={handleChange} required style={{...styles.input, height: '80px'}} />
        </div>

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'جاري الإضافة...' : 'إضافة الطبيب'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f8fafc', padding: '20px', paddingTop: '80px' },
  form: { background: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', width: '100%', maxWidth: '420px' },
  title: { textAlign: 'center', color: '#1a202c', marginBottom: '20px' },
  imageUploadSection: { display: 'flex', justifyContent: 'center', marginBottom: '20px' },
  previewContainer: { width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', border: '2px dashed #00d4ff', backgroundSize: 'cover', backgroundPosition: 'center' },
  inputGroup: { marginBottom: '15px' },
  label: { display: 'block', marginBottom: '5px', color: '#4a5568', fontSize: '14px', fontWeight: '600' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', background: '#00d4ff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' },
  error: { backgroundColor: '#fff5f5', color: '#e53e3e', padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center' }
};

export default AddDoctor;