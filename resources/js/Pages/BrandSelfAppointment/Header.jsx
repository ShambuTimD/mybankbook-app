//import React from "react";
import { FaPowerOff } from "react-icons/fa";

const Header = ({ authenticated, settings, companyData, currentStep = 0 }) => {
  // ---- helper: hard truncate to 24 chars
  const truncate = (text, max = 24) =>
    text && text.length > max ? text.slice(0, max) + "…" : text || "";

  const normalizeOfficeName = (name = "") => {
  if (!name) return "";
  const parts = name.split("-");
  return parts.length > 1 ? parts[parts.length - 1].trim() : name.trim();
};
  // Show company name through step 2; from step 3+, show selected office if available.
 // raw office name from company/session
const rawOfficeName =
  companyData?.display_center ||
  sessionStorage.getItem("korpheal_selected_office_name") ||
  "";

// normalize to remove prefix before dash
const selectedOfficeName = normalizeOfficeName(rawOfficeName);
  const companyName =
    companyData?.company_name || settings?.app_settings?.company_name || "";

  // raw label to decide what to show; then truncate only for display
  const centerNameRaw =
    currentStep >= 3 ? (selectedOfficeName || companyName) : companyName;

  const centerName = truncate(centerNameRaw, 24);
//   console.log("Header centerName:", centerName, "rawOfficeName:", rawOfficeName);

  const roleLabel = authenticated
    ? companyData?.hr_details?.designation ||
      companyData?.hr_details?.role_title ||
      companyData?.hr_details?.role_name ||
      "User"
    : "";

  // --- helper: clear booking-related session keys but keep login/session intact
  const resetBookingSession = () => {
    try {
      const keysToKeep = new Set([
        "session_email",
        "session_company",
        "auth_token",
        "auth_user",
      ]);

      const toRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const looksLikeBookingKey =
          key?.startsWith("korpheal_") ||
          key?.startsWith("booking_") ||
          key === "submission_time" ||
          key === "korpheal_booking_data" ||
          key === "korpheal_resume_step" ||
          key === "korpheal_employee_scroll_pos" ||
          key === "korpheal_selected_office" ||
          key === "korpheal_selected_office_name" ||
          key === "korpheal_selected_company" ||
          key === "korpheal_last_step" ||
          key === "korpheal_csv_upload";
        if (looksLikeBookingKey && !keysToKeep.has(key)) toRemove.push(key);
      }
      toRemove.forEach((k) => sessionStorage.removeItem(k));

      sessionStorage.removeItem("korpheal_booking_data");
      sessionStorage.removeItem("korpheal_resume_step");
      sessionStorage.removeItem("submission_time");
      sessionStorage.setItem("korpheal_resume_step", "choose-mode");
    } catch (e) {
      console.warn("Failed to reset booking session:", e);
    }
  };

  const handleAppNameClick = () => {
    resetBookingSession();
    try { if (window.currentBookingFormState) window.currentBookingFormState = null; } catch {}
    window.location.assign("/brand-self-appointment");
  };
  

  return (
    <div className="sticky top-0 z-30 bg-white shadow-sm">
      <div className="w-full bg-white shadow px-4 md:px-6 py-4">
        <div className="w-full top_bar flex justify-between items-center">
          {/* Left: App Name (clickable) */}
          <div
            className="flex-1 topbar flex items-center cursor-pointer select-none"
            role="button"
            
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleAppNameClick(); }}
            title="Go to booking dashboard"
          >
            <h1 className="text-xl md:text-2xl font-bold text-blue-700 whitespace-nowrap">
              {settings.app_settings.application_name}
            </h1>
          </div>

          {/* Center: Company/Office + Role */}
          {authenticated && (
            <div className="md:flex top_login flex-1 justify-center items-center gap-3">
              <span
                // width clamp + ellipsis as CSS safety net
                className="px-4 font_login py-1 rounded-full bg-blue-100 text-blue-700 text-sm md:text-sm font-semibold max-w-[340px] overflow-hidden text-ellipsis whitespace-nowrap"
                title={`${centerNameRaw} - ${roleLabel}`} // full text on hover
              >
                {centerName} - {roleLabel}
              </span>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to logout?")) {
                    sessionStorage.clear();
                    window.location.href = "/brand-self-appointment";
                  }
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-red-800 transition text-lg"
                title="want to logout"
              >
                <span className="text-sm md:text-base font-small">Logout?</span>
                <FaPowerOff size={10} />
              </button>
            </div>
          )}

          {/* Right: Logo */}
          <div className="flex items-center gap-4 justify-end flex-1">
            <img
              src={settings.app_settings.application_big_logo}
              alt="Company Logo"
              className="h-10 w-auto object-contain"
              title={settings.app_settings.company_name}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
