import React from "react";
import "./Navbar.css";
import { FaHome } from "react-icons/fa";
import { FaUserDoctor } from "react-icons/fa6";
import { FaCalendarCheck } from "react-icons/fa6";
import { FaPhoneFlip } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";



function Navbar() {
  const navigate = useNavigate();
  return (
    <nav className="navbar">
      <div className="navBar-Container">
        <ul>
          <li className="nav-item active" onClick={()=>{
            navigate('/')
          }}>
            <FaHome className="nav-icon" />
            
            
          </li>
          <li className="nav-item" onClick={()=>{
            navigate('/doctors')
          }}>
            <FaUserDoctor className="nav-icon" />
            
          </li>
          <li className="nav-item">
            <FaCalendarCheck className="nav-icon"  onClick={()=>{
            navigate('/slots')
          }}/>
            
          </li>
          <li className="nav-item"  onClick={()=>{
            navigate('/contcat')
          }}>
            <FaPhoneFlip className="nav-icon" />
           
          </li>
         
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;