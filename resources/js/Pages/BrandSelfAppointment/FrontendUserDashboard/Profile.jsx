import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faPhone,
  faSave,
  faEdit,
  faTimes,
  faUserCircle,
  faBriefcase,
  faBuilding,
  faToggleOn,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import ComponentCard from "@/Components/common/ComponentCard";
import { toast } from "react-toastify";

export default function Profile() {
  const [user, setUser] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwords, setPasswords] = useState({
    password: "",
    password_confirmation: "",
  });

  const userData = JSON.parse(sessionStorage.getItem("session_user") || "{}");

  // 🔹 Fetch user profile
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/company-user/profile", {
          headers: { Authorization: `Bearer ${userData.token}` },
        });

        const data = res.data.data;

        // ✅ Enrich company and office info with names (if API already has them)
        if (!data.company_name && data.company) {
          data.company_name = data.company.name;
        }

        if (!data.offices && data.company_office_id) {
          data.offices = data.company_office_id.map((id) => ({
            id,
            office_name: `Office ${id}`,
          }));
        }

        setUser(data);
      } catch (err) {
        console.error("❌ Fetch error:", err.response?.data || err.message);
        toast.error("Failed to load profile.");
      }
    };
    fetchUser();
  }, []);

  // 🔹 Handle input change
  const handleChange = (field, value) => {
    if (field === "phone") {
      // allow only digits and limit 10 chars
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setUser((prev) => ({ ...prev, [field]: digits }));
    } else {
      setUser((prev) => ({ ...prev, [field]: value }));
    }
  };

  // 🔹 Validate form
  const validateForm = () => {
    let formErrors = {};

    if (!user.name?.trim()) formErrors.name = "Full name is required.";
    if (!user.email?.trim()) formErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email))
      formErrors.email = "Invalid email format.";

    if (user.phone && !/^\d{10}$/.test(user.phone))
      formErrors.phone = "Phone number must be exactly 10 digits.";

    if (passwords.password || passwords.password_confirmation) {
      if (passwords.password.length < 6)
        formErrors.password = "Password must be at least 6 characters.";
      if (passwords.password !== passwords.password_confirmation)
        formErrors.password_confirmation = "Passwords do not match.";
    }

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  // 🔹 Save updated data
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the highlighted errors.");
      return;
    }

    try {
      setLoading(true);
      await axios.put(
        "/api/company-user/profile",
        {
          name: user.name,
          email: user.email,
          phone: user.phone,
          designation: user.designation,
          status: user.status,
          password: passwords.password,
          password_confirmation: passwords.password_confirmation,
        },
        { headers: { Authorization: `Bearer ${userData.token}` } }
      );

      toast.success("Profile updated successfully!");
      setEditMode(false);
      setPasswords({ password: "", password_confirmation: "" });
      setErrors({});
    } catch (err) {
      console.error("❌ Update error:", err.response?.data || err.message);
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 space-y-8">
      <ComponentCard>
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <FontAwesomeIcon icon={faUserCircle} className="text-blue-600 text-3xl" />
            My Profile
          </h2>

          {editMode ? (
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <FontAwesomeIcon icon={faSave} />
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditMode(false);
                  setErrors({});
                  setPasswords({ password: "", password_confirmation: "" });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
              >
                <FontAwesomeIcon icon={faTimes} />
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FontAwesomeIcon icon={faEdit} />
              Edit Profile
            </button>
          )}
        </div>

        {/* Fields */}
        <div className="space-y-4">
          {/* Basic Info */}
          {[
            { label: "Full Name", field: "name", icon: faUser },
            { label: "Email", field: "email", icon: faEnvelope },
            { label: "Phone Number", field: "phone", icon: faPhone },
            { label: "Designation", field: "designation", icon: faBriefcase },
            { label: "Status", field: "status", icon: faToggleOn },
          ].map(({ label, field, icon }) => (
            <div key={field} className="flex items-center gap-4 border-b pb-3">
              <FontAwesomeIcon icon={icon} className="text-gray-500 text-lg" />
              <div className="flex flex-col w-full">
                <label className="text-sm text-gray-500">{label}</label>
                {editMode ? (
                  <input
                    type={field === "phone" ? "tel" : "text"}
                    value={user[field] ?? ""}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className={`border rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 ${
                      errors[field] ? "border-red-500" : ""
                    }`}
                    maxLength={field === "phone" ? 10 : undefined}
                    pattern={field === "phone" ? "[0-9]*" : undefined}
                    inputMode={field === "phone" ? "numeric" : undefined}
                  />
                ) : (
                  <p className="text-gray-800 font-medium">{user[field] ?? "-"}</p>
                )}
                {errors[field] && (
                  <span className="text-xs text-red-500 mt-1">{errors[field]}</span>
                )}
              </div>
            </div>
          ))}

          {/* 🔒 Password Fields */}
          {editMode && (
            <>
              <h3 className="text-base font-semibold mt-6 mb-2">Change Password (Optional)</h3>
              <div className="flex items-center gap-4 border-b pb-3">
                <FontAwesomeIcon icon={faLock} className="text-gray-500 text-lg" />
                <div className="flex flex-col w-full">
                  <label className="text-sm text-gray-500">New Password</label>
                  <input
                    type="password"
                    value={passwords.password}
                    onChange={(e) =>
                      setPasswords((p) => ({ ...p, password: e.target.value }))
                    }
                    className={`border rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 ${
                      errors.password ? "border-red-500" : ""
                    }`}
                  />
                  {errors.password && (
                    <span className="text-xs text-red-500 mt-1">{errors.password}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 border-b pb-3">
                <FontAwesomeIcon icon={faLock} className="text-gray-500 text-lg" />
                <div className="flex flex-col w-full">
                  <label className="text-sm text-gray-500">Confirm Password</label>
                  <input
                    type="password"
                    value={passwords.password_confirmation}
                    onChange={(e) =>
                      setPasswords((p) => ({
                        ...p,
                        password_confirmation: e.target.value,
                      }))
                    }
                    className={`border rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 ${
                      errors.password_confirmation ? "border-red-500" : ""
                    }`}
                  />
                  {errors.password_confirmation && (
                    <span className="text-xs text-red-500 mt-1">
                      {errors.password_confirmation}
                    </span>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank if you don’t want to change your password.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Company / Office Info (readonly) */}
<div className="flex items-center gap-4 border-b pb-3">
  <FontAwesomeIcon icon={faBuilding} className="text-gray-500 text-lg" />
  <div className="flex flex-col w-full">
    <label className="text-sm text-gray-500">Company</label>
    <p className="text-gray-800 font-medium">
      {user.company
        ? `${user.company.name} (${user.company.id})`
        : "-"}
    </p>
  </div>
</div>

<div className="flex items-center gap-4 border-b pb-3">
  <FontAwesomeIcon icon={faBuilding} className="text-gray-500 text-lg" />
  <div className="flex flex-col w-full">
    <label className="text-sm text-gray-500">Assigned Offices</label>
    <p className="text-gray-800 font-medium">
      {Array.isArray(user.offices) && user.offices.length > 0
        ? user.offices
            .map((o) =>
              o.office_name ? `${o.office_name} (${o.id})` : `Office ID ${o.id}`
            )
            .join(", ")
        : "-"}
    </p>
  </div>
</div>

        </div>
      </ComponentCard>
    </div>
  );
}
