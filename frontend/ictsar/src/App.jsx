import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/Auth'; // 1. استيراد الـ AuthProvider الخاص بك
import Navbar from './components/navbar/Navbar'; 
import Login from './pages/login/login';
import Home from './pages/Home';
import './App.css'
import Profile from './pages/profile/profile';
import Register from './pages/register/register';
import Doctors from './pages/doctors/Doctors';
import NavTop from './components/navtop/NavTop';
import AppointmentList from './pages/slots/slots';
import ContactUsPage from './pages/concat/Concat';
import AddDoctor from './pages/newDoct/Newdoct';
import OfflinePage from './pages/offline/Offline';

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  if (!isOnline) {
    return <OfflinePage />;
  }
  return (
   
    <AuthProvider> 
      <BrowserRouter>
        
   
        

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/doctors" element={<>
          <NavTop/>
          <Doctors />
          <Navbar /> 
          </>} />
          <Route path="/profile" element={<>
          <Profile/>
          <Navbar /> 
          
          </>} />
          <Route path="/contcat" element={<>
           <NavTop/>
          <ContactUsPage/>
          <Navbar /> 
          
          </>} />
          <Route path="/Register" element={<Register/>} />
          <Route path="/slots" element={
            <>
              <NavTop/>
            <AppointmentList/>
               <Navbar /> 
            </>
            
            } />
          <Route path="/newdoctor" element={
            <>
              <NavTop/>
            <AddDoctor/>
               <Navbar /> 
            </>
            
            } />
        </Routes>

      </BrowserRouter>
    </AuthProvider>
  )
}

export default App;