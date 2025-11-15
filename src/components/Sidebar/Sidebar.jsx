import React, { useState } from 'react';
import './Sidebar.css';
import { assets } from '../../assets/assets';
import { NavLink } from 'react-router-dom';
import { FaChartBar, FaBullhorn, FaBars, FaTimes } from 'react-icons/fa';


const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          {/* REMOVE static text “Dashboard” and replace with nothing */}
          <h2 className="sidebar-title">Admin Panel</h2>

          <button className="sidebar-close" onClick={toggleSidebar}>
            <FaTimes size={20} />
          </button>
        </div>

        <div className="sidebar-options">

          {/* ✅ Dashboard Button (NEW) */}
          <NavLink 
            to="/dashboard" 
            className="sidebar-option" 
            onClick={() => setIsOpen(false)}
          >
          <FaBars size={22} style={{ color: "#414141ff" }} />
          <p>Dashboard</p>
          </NavLink>

          <NavLink 
            to="/add" 
            className="sidebar-option" 
            onClick={() => setIsOpen(false)}
          >
            <img src={assets.add_icon} alt="Add" />
            <p>Add Items</p>
          </NavLink>

          <NavLink 
            to="/list" 
            className="sidebar-option" 
            onClick={() => setIsOpen(false)}
          >
            <img src={assets.order_icon} alt="List" />
            <p>List Items</p>
          </NavLink>

          <NavLink 
            to="/orders" 
            className="sidebar-option" 
            onClick={() => setIsOpen(false)}
          >
            <img src={assets.order_icon} alt="Orders" />
            <p>Orders</p>
          </NavLink>

          <NavLink
            to="/product-analytics"
            className="sidebar-option"
            onClick={() => setIsOpen(false)}
          >
            <FaChartBar size={20} style={{ color: "#414141ff" }} />
            <p>Product Analytics</p>
          </NavLink>


          <NavLink 
            to="/broadcast" 
            className="sidebar-option" 
            onClick={() => setIsOpen(false)}
          >
            <FaBullhorn size={22} style={{ color: '#414141ff' }} />
            <p>Broadcast</p>
          </NavLink>

        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
    </>
  );
};

export default Sidebar;
