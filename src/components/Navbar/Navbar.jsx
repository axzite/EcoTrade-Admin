import React from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";

const Navbar = () => {
  return (
    <div className="navbar">
      <div className="AdminLogoDiv">
        <img className="AdminLogoDiv-logo" src={assets.logo} alt="Admin Logo" />
        <p className="AdminLogoDiv-logoText">उत्तम स्वाद और गुणवत्ता की पहचान</p>
      </div>

      <div className="navbar-profile">
        <img className="profile" src={assets.profile_image} alt="Profile" />
      </div>
    </div>
  );
};

export default Navbar;
