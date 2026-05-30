import { useState } from 'react'; // 1. استيراد useState لتخزين الوقت إذا أردت استخدامه في الواجهة
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { StaticTimePicker } from '@mui/x-date-pickers/StaticTimePicker';
import './Timer.css';

export default function StaticTimePickerLandscape() {
  const [selectedTime, setSelectedTime] = useState('');

  const handleTimeChange = (newValue) => {

    if (newValue) {
    
      const formattedTime = newValue.format('hh:mm A'); 
      
     
      console.log("الوقت المختار:", formattedTime);

      
     
      setSelectedTime(formattedTime);
      localStorage.setItem("time",formattedTime)
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
     
        
        <p>اختر <span>التاريخ و الوقت</span></p>
     
      <div style={{ textAlign: 'center' }}>
        <StaticTimePicker 
          orientation="portrait"
          className="custom-time-picker"
          onChange={handleTimeChange} // 2. إضافة حدث التغيير هنا
          slotProps={{
            actionBar: {
              actions: [], 
            },
          }}
        />
        
       
       
      </div>
    </LocalizationProvider>
  );
}