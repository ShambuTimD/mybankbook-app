// resources/js/Pages/BrandSelfAppointment/Footer.jsx

import React from "react";

const Footer = ({ companyName }) => {
  return (
    <footer className="bg-white text-center text_font text-sm text-gray-600 py-2 border-t flex justify-center w-full z-50">
      © {new Date().getFullYear()} {companyName || ""}
    </footer>
  );
};

export default Footer;
