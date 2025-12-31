// In Dashboard.jsx
import React, { useState, useEffect } from "react";
import DashboardOverview from "@/Pages/BrandSelfAppointment/FrontendUserDashboard/DashboardOverview";
import BookingsList from "@/Pages/BrandSelfAppointment/FrontendUserDashboard/BookingsList";
import Bills from "@/Pages/BrandSelfAppointment/FrontendUserDashboard/Bills";
import Notifications from "@/Pages/BrandSelfAppointment/FrontendUserDashboard/Notifications";
import Support from "@/Pages/BrandSelfAppointment/FrontendUserDashboard/Support";
import Reports from "@/Pages/BrandSelfAppointment/FrontendUserDashboard/Reports";
import Profile from "@/Pages/BrandSelfAppointment/FrontendUserDashboard/Profile"; 
import Ticker from "@/Pages/BrandSelfAppointment/FrontendUserDashboard/Ticker";
const Dashboard = () => {
  const steps = [
    { key: "dashboard", path: "dashboard", component: <DashboardOverview /> },
    { key: "bookings", path: "bookings", component: <BookingsList /> },
    { key: "bills", path: "bills", component: <Bills /> },
    { key: "reports", path: "reports", component: <Reports /> },
    { key: "notifications", path: "notifications", component: <Notifications /> },
    { key: "support", path: "support", component: <Support /> },
    { key: "profile", path: "profile", component: <Profile /> },
  ];

  // 👇 FIX: Check pathname instead of search params
  const getSectionFromURL = () => {
    const path = window.location.pathname; // e.g., "/f/bookings"
    
    // Find the step where the path defined in 'steps' exists in the URL
    const foundStep = steps.find(step => path.includes(step.path));
    
    // Return the key if found, otherwise default to dashboard
    return foundStep ? foundStep.key : "dashboard";
  };

  const [activeSection, setActiveSection] = useState(getSectionFromURL());

  // ✅ React to URL changes dynamically (No changes needed here, this logic is good)
  useEffect(() => {
    const handleURLChange = () => {
      setActiveSection(getSectionFromURL());
    };

    window.addEventListener("popstate", handleURLChange);
    window.addEventListener("pushstate", handleURLChange);
    window.addEventListener("replacestate", handleURLChange);

    // also react when same page updated via router.visit
    const observer = new MutationObserver(() => {
      handleURLChange();
    });
    observer.observe(document.body, { subtree: true, childList: true });

    return () => {
      window.removeEventListener("popstate", handleURLChange);
      window.removeEventListener("pushstate", handleURLChange);
      window.removeEventListener("replacestate", handleURLChange);
      observer.disconnect();
    };
  }, []);

  const activeStep = steps.find(
    (step) => step.key === activeSection
  ) || steps[0];

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Ticker officeIds={[1]} />
        <main className="flex-1 p-6">
            {activeStep?.component || <p>No section found.</p>}
        </main>
      </div>
    </>
  );
};

export default Dashboard;