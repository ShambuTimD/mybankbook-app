import React, { useEffect, useRef, useState } from "react";
import { router } from "@inertiajs/react";
import { FaUserCircle } from "react-icons/fa";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
// 1. Import React Select
import Select from "react-select";

dayjs.extend(relativeTime);

const Header = ({
    authenticated,
    settings,
    companyData,
    currentStep = 0,
    steps = [],
    isDashboardView: initialDashboardView,
}) => {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [filterValue, setFilterValue] = useState(
        sessionStorage.getItem("selected_office_id") || "all"
    );

    // Detect current FY
    const getCurrentFinancialYear = () => {
        const now = new Date();
        const startYear =
            now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        return `${startYear}-${startYear + 1}`;
    };

    const defaultFY =
        sessionStorage.getItem("selected_financial_year") ||
        getCurrentFinancialYear();
    const [unreadCount, setUnreadCount] = useState(0);
    const [financialYear, setFinancialYear] = useState(defaultFY);

    useEffect(() => {
        if (!sessionStorage.getItem("selected_financial_year")) {
            sessionStorage.setItem("selected_financial_year", defaultFY);
        }
    }, [defaultFY]);

    const dropdownRef = useRef(null);

    const hideDashboardToggle =
        // window.location.pathname.includes("thank-you") ||
        window.location.pathname.includes("failed") ||
        window.location.pathname.includes("submitted-data-failed");

    // 🟢 UPDATED: Added check for 'notifications' to hide the secondary bar
    const hideProgressBar =
        window.location.pathname.includes("thank-you") ||
        window.location.pathname.includes("failed") ||
        window.location.pathname.includes("submitted-data-failed") ||
        window.location.pathname.includes("notifications"); 

    const isPageUnderMaintenance = false;
    const [isDashboardView, setIsDashboardView] = useState(
        initialDashboardView ??
        sessionStorage.getItem("korpheal_is_dashboard") === "true"
    );
    const [showLoader, setShowLoader] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifying, setNotifying] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [selectedNotification, setSelectedNotification] = useState(null);

    const [settingsData, setSettingsData] = useState({
        application_name: settings?.application_name || "",
        application_big_logo: settings?.application_big_logo || "",
        company_name: settings?.company_name || "",
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get(route("frontend.settings"));
                if (res.data.success && res.data.data?.settings) {
                    const apiSettings = res.data.data.settings;
                    setSettingsData({
                        application_name: apiSettings.application_name || "",
                        application_big_logo:
                            apiSettings.application_big_logo || "",
                        company_name: apiSettings.company_name || "",
                    });
                }
            } catch (err) {
                console.error("Failed to fetch settings:", err);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        if (isPageUnderMaintenance) {
            setShowLoader(true);
            router.visit(route("maintenance"));
        }
        const listener = () => {
            setIsDashboardView(
                sessionStorage.getItem("korpheal_is_dashboard") === "true"
            );
        };
        window.addEventListener("storage", listener);
        return () => window.removeEventListener("storage", listener);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const truncate = (text, max = 24) =>
        text && text.length > max ? text.slice(0, max) + "…" : text || "";

    const normalizeOfficeName = (name = "") => {
        if (!name) return "";
        const parts = name.split("-");
        return parts.length > 1 ? parts[parts.length - 1].trim() : name.trim();
    };

    const rawOfficeName =
        companyData?.display_center ||
        sessionStorage.getItem("korpheal_selected_office_name") ||
        "";

    const selectedOfficeName = normalizeOfficeName(rawOfficeName);

    const companyName =
        companyData?.company_name || settingsData.company_name || "";

    const centerNameRaw =
        currentStep >= 3 ? selectedOfficeName || companyName : companyName;
    const centerName = truncate(centerNameRaw, 24);

    const roleLabel = authenticated
        ? companyData?.hr_details?.designation ||
        companyData?.hr_details?.role_title ||
        companyData?.hr_details?.role_name ||
        "User"
        : "";

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const userData = JSON.parse(sessionStorage.getItem("session_user") || "{}");
                const token = userData?.token || "";

                const res = await axios.get("/api/notifications/list", {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                });

                if (res.data.success) {
                    const list = res.data.data || [];
                    setNotifications(list);
                    const unread = list.filter(n => n.is_read === "unread").length;
                    setUnreadCount(unread);
                }
            } catch (err) {
                console.error("Notification fetch error", err);
            }
        };
        fetchNotifications();
    }, []);

    const [financialYears, setFinancialYears] = useState([]);
    const userData = JSON.parse(sessionStorage.getItem("session_user") || "{}");
    const token = userData?.token || "";

    const axiosConfig = {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
    };

    useEffect(() => {
        const loadYears = async () => {
            try {
                const res = await axios.get(route("financial.years"), axiosConfig);
                if (res.data.success) {
                    setFinancialYears(res.data.data.financial_years);
                }
            } catch (err) {
                console.error("Failed to load FY list", err);
            }
        };
        loadYears();
    }, []);

    useEffect(() => {
        const listener = () => {
            const value = sessionStorage.getItem("korpheal_is_dashboard");
            if (value === "true") {
                setShowLoader(true);
            }
        };
        window.addEventListener("storage", listener);
        return () => window.removeEventListener("storage", listener);
    }, []);

    useEffect(() => {
        const counterRef = { count: 0 };
        const timeoutRef = { id: null };

        const startHandler = () => {
            counterRef.count += 1;
            setShowLoader(true);
            if (timeoutRef.id) {
                clearTimeout(timeoutRef.id);
                timeoutRef.id = null;
            }
            timeoutRef.id = setTimeout(() => {
                counterRef.count = 0;
                setShowLoader(false);
                timeoutRef.id = null;
            }, 20000);
        };

        const doneHandler = () => {
            counterRef.count = Math.max(0, counterRef.count - 1);
            if (counterRef.count <= 0) {
                setShowLoader(false);
                counterRef.count = 0;
                if (timeoutRef.id) {
                    clearTimeout(timeoutRef.id);
                    timeoutRef.id = null;
                }
            }
        };

        window.addEventListener("office_change_start", startHandler);
        window.addEventListener("office_change_done", doneHandler);
        return () => {
            window.removeEventListener("office_change_start", startHandler);
            window.removeEventListener("office_change_done", doneHandler);
            if (timeoutRef.id) clearTimeout(timeoutRef.id);
        };
    }, []);

    useEffect(() => {
        const handleFYExternalChange = () => {
            const updatedFY = sessionStorage.getItem("selected_financial_year");
            if (updatedFY) {
                setFinancialYear(updatedFY);
            }
        };
        window.addEventListener("financial_year_changed", handleFYExternalChange);
        return () => window.removeEventListener("financial_year_changed", handleFYExternalChange);
    }, []);

    // 2. Prepare Data for React Select
    // Financial Year Options
    const fyOptions = [
        { value: "lifetime", label: "Lifetime" },
        ...financialYears.map((fy) => ({ value: fy, label: fy })),
    ];

    // Office Options
    const officeOptions = [
        { value: "all", label: "All Offices" },
        ...(companyData?.offices || []).map((o) => ({
            value: o.office_id, // Ensure this matches the type stored in filterValue (string vs number)
            label: o.office_name,
        })),
    ];

    // 3. Custom Styles: Enforce fixed height and alignment
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            // Width & Height
            minWidth: "200px",
            height: "42px",      // ✅ Enforce fixed height
            minHeight: "42px",   // ✅ Enforce fixed min-height

            // Borders & Colors
            borderRadius: "0.375rem", // rounded-md
            borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb", // blue-500 : gray-200
            boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            backgroundColor: "white",
            "&:hover": {
                borderColor: "#3b82f6",
            },
        }),
        valueContainer: (provided) => ({
            ...provided,
            height: "42px",       // ✅ Match control height
            padding: "0 12px",    // ✅ Padding for text
            display: "flex",
            alignItems: "center", // ✅ Vertically center the text
        }),
        input: (provided) => ({
            ...provided,
            margin: "0px",
            padding: "0px",
        }),
        singleValue: (provided) => ({
            ...provided,
            margin: "0px",
            color: "#374151", // gray-700
            fontWeight: "500",
        }),
        indicatorsContainer: (provided) => ({
            ...provided,
            height: "42px",       // ✅ Match control height
        }),
        dropdownIndicator: (provided) => ({
            ...provided,
            padding: "8px",       // ✅ Center the arrow icon
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 9999,
            borderRadius: "0.5rem",
            marginTop: "4px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected
                ? "#eff6ff" // blue-50
                : state.isFocused
                    ? "#f3f4f6" // gray-100
                    : "white",
            color: state.isSelected ? "#1d4ed8" : "#374151",
            cursor: "pointer",
            padding: "10px 12px",
        }),
    };

    return (
        <div className="sticky top-0 z-30 bg-white shadow-sm">
            {/* === Top Bar === */}
            <div className="w-full bg-white shadow px-4 md:px-6 py-4">
                <div className="w-full top_bar flex justify-between items-center">
                    {/* === LEFT: Application Name === */}
                    <h1 className="flex-1 text-xl md:text-2xl font-bold text-blue-700 whitespace-nowrap cursor-pointer">
                        {settingsData.application_name || "Corporate Wellness"}
                    </h1>

                    {/* === CENTER: Company/Office + Role === */}
                    {authenticated && (
                        <div className="md:flex top_login flex-1 justify-center items-center gap-3">
                            <span
                                className="px-4 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold max-w-[340px] overflow-hidden text-ellipsis whitespace-nowrap"
                                title={`${centerNameRaw} - ${roleLabel}`}
                            >
                                {centerName} - {roleLabel}
                            </span>
                        </div>
                    )}

                    {/* === RIGHT: Logo + Profile === */}
                    <div className="flex items-center gap-6 justify-end flex-1">
                        {/* ✅ Application Logo */}
                        <img
                            src={
                                settingsData.application_big_logo ||
                                "/default/logo.png"
                            }
                            alt="App Logo"
                            className="h-10 w-auto object-contain"
                            title={settingsData.company_name || ""}
                        />

                        {/* 🔔 Notification Bell */}
                        {authenticated && !hideDashboardToggle && (
                            <div className="relative">
                                <button
                                    onClick={() => {
                                        setIsNotificationOpen(!isNotificationOpen);
                                        setNotifying(false);
                                    }}
                                    className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full h-11 w-11 hover:bg-gray-100"
                                >
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center shadow-lg">
                                            {unreadCount > 99 ? "99+" : unreadCount}
                                        </span>
                                    )}
                                    <FontAwesomeIcon icon={faBell} className="text-gray-700 text-lg" />
                                </button>

                                {/* Dropdown */}
                                {isNotificationOpen && (
                                    <div className="absolute right-0 mt-4 w-[360px] rounded-2xl border border-gray-200 bg-white p-3 shadow-xl z-50">
                                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                                            <h5 className="text-lg font-semibold">Notifications</h5>
                                        </div>

                                        <ul className="flex flex-col overflow-y-auto max-h-[400px] custom-scrollbar">
                                            {notifications.length === 0 ? (
                                                <li className="text-center text-gray-500 py-3">
                                                    No notifications found.
                                                </li>
                                            ) : (
                                                notifications.map((item) => (
                                                    <li
                                                        key={item.id}
                                                        className="flex gap-3 justify-between items-start rounded-lg border-b border-gray-100 p-3 hover:bg-gray-100"
                                                    >
                                                        <div className="flex items-start gap-2 w-full">
                                                            <div className="flex flex-col w-full">
                                                                <span className="text-sm font-medium text-gray-700">
                                                                    {item.message}
                                                                </span>
                                                                <span className="text-xs text-gray-400">
                                                                    {item.date_time
                                                                        ? dayjs(item.date_time).fromNow()
                                                                        : "Just now"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedNotification(item);
                                                            }}
                                                            className="text-gray-500 hover:text-blue-600"
                                                            title="View Details"
                                                        ></button>
                                                    </li>
                                                ))
                                            )}
                                        </ul>

                                        <button
                                            onClick={() => {
                                                // 1. Check where the user is currently (True = Dashboard, False = Booking Wizard)
                                                const currentIsDashboard = sessionStorage.getItem("korpheal_is_dashboard") === "true";

                                                // 2. Save this context so the Back button knows where to go
                                                sessionStorage.setItem("notification_back_origin", currentIsDashboard ? "dashboard" : "booking");

                                                // 3. Force dashboard mode to true
                                                sessionStorage.setItem("korpheal_is_dashboard", "true");
                                                window.dispatchEvent(new Event("storage"));

                                                // 4. Navigate
                                                router.visit("/f/notifications");
                                            }}
                                            className="block w-full px-4 py-2 mt-3 text-sm font-medium text-center border rounded-lg hover:bg-gray-100"
                                        >
                                            View All Notifications
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Profile Dropdown */}
                        {authenticated && (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                                >
                                    <FaUserCircle size={22} className="text-gray-700" />
                                </button>

                                {showProfileMenu && (
                                    <div className="absolute right-0 mt-3 w-64 bg-white border rounded-lg shadow-lg z-50">
                                        <div className="px-4 py-3 border-b bg-gray-50">
                                            {(() => {
                                                let userData = null;
                                                try {
                                                    const raw = sessionStorage.getItem("session_user");
                                                    if (raw) userData = JSON.parse(raw);
                                                } catch (e) {
                                                    console.error("Error parsing session_user", e);
                                                }

                                                const fullName = userData?.first_name
                                                    ? `${userData.first_name} ${userData.last_name || ""}`
                                                    : "User";

                                                const roleLabel =
                                                    companyData?.hr_details?.designation ||
                                                    companyData?.hr_details?.role_title ||
                                                    companyData?.hr_details?.role_name ||
                                                    "";

                                                return (
                                                    <>
                                                        <p className="text-sm font-semibold text-gray-800">
                                                            {fullName}{" "}
                                                            {roleLabel ? `– ${roleLabel}` : ""}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {userData?.email || ""}
                                                        </p>
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        <button
                                            onClick={() => {
                                                setShowProfileMenu(false);
                                                sessionStorage.setItem("korpheal_is_dashboard", "true");
                                                setShowLoader(true);
                                                router.visit("/f/profile");
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                        >
                                            Profile
                                        </button>

                                        <button
                                            onClick={() => {
                                                const newValue = isDashboardView ? "false" : "true";
                                                sessionStorage.setItem("korpheal_is_dashboard", newValue);
                                                window.dispatchEvent(new Event("storage"));
                                                setShowProfileMenu(false);

                                                if (newValue === "false") {
                                                    setShowLoader(true);
                                                    window.location.assign(route("brandselfappointment.index"));
                                                } else {
                                                    router.visit(route("frontend.dashboard"));
                                                }
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            {isDashboardView ? "Back to Bookings" : "Visit Dashboard"}
                                        </button>

                                        <div className="border-t px-4 py-2 text-sm text-gray-600 font-semibold">
                                            My Company & Offices
                                        </div>
                                        <div className="max-h-40 overflow-y-auto">
                                            {(companyData?.offices || []).map((o) => (
                                                <button
                                                    key={o.office_id}
                                                    onClick={(e) => e.preventDefault()}
                                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    {o.office_name}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => {
                                                if (window.confirm("Are you sure you want to logout?")) {
                                                    sessionStorage.clear();
                                                    window.location.assign(route("brandselfappointment.index"));
                                                }
                                                setShowProfileMenu(false);
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* === Step Tabs / Progress Bar === */}
            {!hideProgressBar &&
                (isDashboardView ? (
                    // === Dashboard Tabs ===
                    <div className="w-full header_mobil bg-gray-50 border-b px-6 py-2 relative">
                        <div className="flex justify-center items-center gap-5">
                            {[
                                "Dashboard",
                                "Bookings",
                                "Reports",
                                "Support",
                            ].map((tab, i, arr) => {
                                const path = window.location.pathname.toLowerCase();
                                let isActive = false;
                                if (tab === "Dashboard" && path.includes("dashboard")) isActive = true;
                                else if (tab === "Bookings" && path.includes("bookings")) isActive = true;
                                else if (tab === "Reports" && path.includes("reports")) isActive = true;
                                else if (tab === "Support" && path.includes("support")) isActive = true;
                                else if (
                                    tab === "Dashboard" &&
                                    !path.includes("bookings") &&
                                    !path.includes("reports") &&
                                    !path.includes("support")
                                )
                                    isActive = true;

                                return (
                                    <React.Fragment key={i}>
                                        <div
                                            className={`cursor-pointer text-base hed_font md:text-lg transition-all duration-200 ${isActive
                                                ? "text-blue-700 font-semibold underline underline-offset-4"
                                                : "text-gray-500 hover:text-blue-600"
                                                }`}
                                            onClick={() => {
                                                setShowLoader(true);
                                                const pathMap = {
                                                    dashboard: "/f/dashboard",
                                                    bookings: "/f/bookings",
                                                    reports: "/f/reports",
                                                    support: "/f/support",
                                                };
                                                const goTo = pathMap[tab.toLowerCase()] || "/f/dashboard";
                                                router.visit(goTo);
                                            }}
                                        >
                                            {tab}
                                        </div>
                                        {i !== arr.length - 1 && (
                                            <span className="text-gray-300 font-bold text-xl">|</span>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        {/* === Financial Year + Offices Dropdown (With React Select) === */}
                        {(() => {
                            const isSupportSection = window.location.pathname
                                .toLowerCase()
                                .includes("support");
                            if (isSupportSection) return null;

                            return (
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                    {/* 🔵 Financial Year React Select */}
                                    <div className="min-w-[200px]">
                                        <Select
                                            value={fyOptions.find((opt) => opt.value === financialYear)}
                                            options={fyOptions}
                                            onChange={(selectedOption) => {
                                                const fy = selectedOption.value;
                                                setFinancialYear(fy);
                                                sessionStorage.setItem("selected_financial_year", fy);
                                                setShowLoader(true);
                                                router.visit(window.location.pathname, {
                                                    preserveScroll: true,
                                                    preserveState: false,
                                                });
                                            }}
                                            styles={customSelectStyles}
                                            placeholder="Select Financial Year"
                                            isSearchable={false}
                                        />
                                    </div>

                                    {/* 🔵 Office React Select */}
                                    <div className="min-w-[220px]">
                                        <Select
                                            value={
                                                officeOptions.find(
                                                    (opt) =>
                                                        String(opt.value) === String(filterValue)
                                                ) || officeOptions[0]
                                            }
                                            options={officeOptions}
                                            onChange={(selectedOption) => {
                                                const selectedOfficeId = selectedOption.value;
                                                setFilterValue(selectedOfficeId);
                                                sessionStorage.setItem("selected_office_id", selectedOfficeId);
                                                setShowLoader(true);

                                                setTimeout(() => {
                                                    window.dispatchEvent(new Event("office_changed"));
                                                }, 0);
                                            }}
                                            styles={customSelectStyles}
                                            placeholder="Select Office"
                                            isSearchable={true}
                                        />
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                ) : (
                    // === Booking Progress Bar ===
                    currentStep !== 0 &&
                    currentStep !== -1 && (
                        <div className="w-full header_mobil bg-gray-50 border-b px-6 py-2">
                            <div className="h-2 bg-gray-200 w-full mb-2">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-300"
                                    style={{
                                        width: `${((currentStep / (steps.length - 1)) * 100).toFixed(0)}%`,
                                    }}
                                />
                            </div>
                            <div className="flex flex-wrap justify-center items-center gap-5 bg-white">
                                {steps
                                    .filter((_, i) => i !== 0 && i !== steps.length - 1)
                                    .map((label, i, arr) => {
                                        const adjustedIndex = i + 1;
                                        const isActive = adjustedIndex === currentStep;
                                        return (
                                            <React.Fragment key={adjustedIndex}>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`text-base hed_font md:text-lg transition-all duration-200 ${isActive
                                                            ? "text-blue-700 font-semibold underline underline-offset-4"
                                                            : "text-gray-500"
                                                            }`}
                                                    >
                                                        {label}
                                                    </div>
                                                </div>
                                                {i !== arr.length - 1 && (
                                                    <span className="text-gray-300 font-bold text-xl">|</span>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                            </div>
                        </div>
                    )
                ))}
        </div>
    );
};

export default Header;