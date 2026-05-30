
import React, { useEffect, useState } from "react";
import { Calendar } from 'primereact/calendar';
import './Timer.css';
// 1. ملفات التنسيق الأساسية لمكتبة PrimeReact
import "primereact/resources/themes/lara-light-cyan/theme.css";  // يمكنك تغيير الثيم حسب رغبتك (مثل lara-light-blue)
import "primereact/resources/primereact.min.css";

// 2. ملف الأيقونات الخاص بالمكتبة (مهم لأسهم التنقل بين الأشهر في الكالندر)
import "primeicons/primeicons.css";


export default function MinMaxDemo() {
    let today = new Date();
    let month = today.getMonth();
    let year = today.getFullYear();
    let prevMonth = month === 0 ? 11 : month - 1;
    let prevYear = prevMonth === 11 ? year - 1 : year;
    let nextMonth = month === 11 ? 0 : month + 1;
    let nextYear = nextMonth === 0 ? year + 1 : year;

    const [date, setDate] = useState(null);
  
       
   

    let minDate = new Date();

    minDate.setMonth(prevMonth);
    minDate.setFullYear(prevYear);

    let maxDate = new Date();

    maxDate.setMonth(nextMonth);
    maxDate.setFullYear(nextYear);
     

    return (
        <div className="card flex justify-content-center">
       <Calendar 
    placeholder="Set Date:" 
    value={date} 
    onChange={(e) => {
        // التأكد أولاً أن المستخدم اختار تاريخاً فعلياً ولم يمسحه
        if (e.value) {
            setDate(e.value);
            localStorage.setItem("year", e.value.getFullYear());
            localStorage.setItem("month", (e.value.getMonth() + 1));
            localStorage.setItem("day", e.value.getDate());
         
        } else {
            setDate(null);
        }
    }} 
    minDate={minDate} 
    maxDate={maxDate} 
    readOnlyInput 
/>
        </div>
    )
}
        
