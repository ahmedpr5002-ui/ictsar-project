import React, { useEffect, useState } from 'react';
import './Doctor.css';
import axios from "axios";

export default function ImageRadioButtons() {
  const [imageOptions, setImageOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(''); 
  const [showAll, setShowAll] = useState(false); 


  useEffect(() => {
    axios
      .get("http://localhost:3000/doctor/Doctors")
      .then((response) => {
        console.log("البيانات القادمة:", response.data);
        const doctorsData = response.data.doctors || response.data; 

        const formattedDoctors = doctorsData.map((doctor) => ({
          id: doctor._id || doctor.id, 
          label: doctor.name, 
          url: doctor.image.startsWith('http') 
            ? doctor.image 
            : `http://localhost:3000/${doctor.image.replace(/\\/g, '/')}`
        }));

        setImageOptions(formattedDoctors);
      })
      .catch((error) => {
        console.error("حدث خطأ أثناء جلب البيانات:", error);
      });
  }, []);

 
  useEffect(() => {
    if (selectedOption) { 
      localStorage.setItem("doctor", selectedOption);
      
    }
  }, [selectedOption]); 
  const handleChange = (id) => {
    setSelectedOption(id);
  };

  const displayedDoctors = showAll ? imageOptions : imageOptions.slice(0, 3);

  return (
    <div className="mobile-doctors-container">
      
      <div className="section-header-mobile">
        <h3 className="section-main-title">اختر <span>الطبيب</span></h3>
        <span 
          className="section-view-all" 
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "عرض أقل" : "عرض الكل"}
        </span>
      </div>
      
      <div className="horizontal-scroll-wrapper">
        {displayedDoctors.map((option) => {
          const isSelected = selectedOption === option.id;
          
          return (
            <div 
              key={option.id} 
              onClick={() => handleChange(option.id)} 
              className={`doctor-mobile-card ${isSelected ? 'card-active' : ''}`}
            >
              {isSelected && <div className="selected-badge-check">✓</div>}
           
              <div className="doctor-avatar-wrapper">
                <img 
                  src={option.url} 
                  alt={option.label} 
                  className="doctor-avatar-img"
                />
              </div>
              
              <div className="doctor-card-info">
                <div className="doctor-name-text">{option.label}</div>
                <div className="doctor-specialty-text">طبيب متخصص</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}