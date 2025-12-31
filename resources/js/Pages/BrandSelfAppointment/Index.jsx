import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addDays, startOfDay, format } from "date-fns";
import { Head } from "@inertiajs/react";
import { route } from "ziggy-js";
import { FaInfoCircle } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faGlobe } from "@fortawesome/free-solid-svg-icons";

// Component Imports
import Header from "@/Pages/BrandSelfAppointment/Header";
import Footer from "@/Pages/BrandSelfAppointment/Footer";
import ThankYouPage from "@/Pages/BrandSelfAppointment/ThankYouPage";
import Dashboard from "./Dashboard";

// --- Constants & Static Data ---

const steps = [
    "Login",
    "Choose Booking Mode",
    "Appointment Details",
    "Employee Information",
    "Review & Confirm Booking",
    "Success",
];

const roleMap = { 4: "Company Admin", 5: "Company Executive" };
const roleDescriptions = {
    4: "Admin Company user can make bookings for all offices and cost centers under their company.",
    5: "Executive user can make bookings only for the office/cost center allocated to them.",
};

const printOnlyStyle = `@media print { body * { visibility: hidden !important; } .print-only, .print-only * { visibility: visible !important; } .print-only { position: absolute !important; left: 0; top: 0; width: 100vw; height: 100vh; background: white !important; z-index: 9999 !important; } }`;

const demoCredentials = [
    {
        company: "TimD",
        offices: [
            {
                name: "TimD - Head Office",
                users: [
                    { name: "Suman Kumar", email: "suman@timd.com", password: "password123", role_id: 4 },
                    { name: "Debasish Thakur", email: "debashish@timd.com", password: "password123", role_id: 5 },
                ],
            },
        ],
    },
    {
        company: "TimDigital",
        offices: [
            {
                name: "TimDigital - Tech Hub",
                users: [
                    { name: "Ravi Sharma", email: "ravi@timdigital.com", password: "securepass456", role_id: 4 },
                    { name: "Shivam Gupta", email: "shivam@timdigital.com", password: "securepass456", role_id: 5 },
                ],
            },
        ],
    },
    {
        company: "KORPHEAL SERVICES LLP",
        offices: [
            {
                name: "KORPHEAL SERVICES LLP",
                users: [
                    { name: "Arijit Adhya", email: "digitalkadhya@gmail.com", password: "securepass456", role_id: 4 },
                ],
            },
        ],
    },
];

// --- Utility Functions ---

const getOfficeListForUser = (user, company) => {
    if (!company || !Array.isArray(company.offices)) return [];
    const active = company.offices.filter((o) => (o.status || "active") === "active");
    const role = (user?.role_name || "").toLowerCase();

    if (role === "company_admin") return active.map((o) => o.office_name);

    if (role === "company_executive") {
        const ids = Array.isArray(user?.office_ids) ? user.office_ids.map((n) => Number(n)) : [];
        const subset = active.filter((o) => ids.includes(Number(o.id ?? o.office_id)));
        return subset.map((o) => o.office_name);
    }
    return active.map((o) => o.office_name);
};

const findOfficeObjByName = (company, officeName) => {
    if (!company || !Array.isArray(company.offices)) return null;
    return company.offices.find((o) => o.office_name === officeName) || null;
};

const toISODateLocal = (d) => {
    if (!d) return null;
    if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const dt = new Date(d);
    if (isNaN(dt)) return null;
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

const toISODate = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    return isNaN(dt) ? null : dt.toISOString().split("T")[0];
};

const uuid4 = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 0xf) >> 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

const pickExcelUrl = (obj) =>
    obj?.data?.excel_download || obj?.excel_download || obj?.data?.excel_download_url || obj?.excel_download_url || obj?.links?.excel_download || "";

// --- Main Component ---

const ChatFormHealthProject = () => {
    // -- State --
    const [isDashboardView, setIsDashboardView] = useState(sessionStorage.getItem("korpheal_is_dashboard") === "true");
    const [settings, setSettings] = useState({});
    const [bookingOffset, setBookingOffset] = useState(1);
    const [companyData, setCompanyData] = useState(null);

    // Auth & User State
    const [authenticated, setAuthenticated] = useState(false);
    const [loggedUser, setLoggedUser] = useState(null);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedOffice, setSelectedOffice] = useState(null);
    const [officeLocations, setOfficeLocations] = useState([]);

    // Form & Flow State
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [bookingMode, setBookingMode] = useState("");
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [submissionSuccess, setSubmissionSuccess] = useState(false);
    const [bookingRef, setBookingRef] = useState("");
    const [bookingStatus, setBookingStatus] = useState(null);

    // 🟢 Ref to track submission so we can bypass the alert
    const isSubmitting = useRef(false);

    // UI State
    const [popupVisible, setPopupVisible] = useState(false);
    const [popupType, setPopupType] = useState("success");
    const [showPassword, setShowPassword] = useState(false);
    const [highlightedFields, setHighlightedFields] = useState({});
    const [generatedCaptcha, setGeneratedCaptcha] = useState("");
    const [isVerified, setIsVerified] = useState(false);
    const [isCaptchaEnabled, setIsCaptchaEnabled] = useState(false);
    const [placement, setPlacement] = useState("bottom-start");

    const [form, setForm] = useState({
        company_email: "",
        company_password: "",
        csv_file: null,
        office_location: "",
        collection_mode: "",
        appointment_date: null,
        appointment_time: "",
        notes: "",
        employees: [
            {
                id: "", name: "", designation: "", age: "", gender: "", email: "", phone: "",
                dob: null, conditions: [], other_condition: "",
                has_dependents: false, dependents: [], remarks: "", home_address: ""
            },
        ],
        agreed: false,
        captcha: "",
    });

    const isDashboard = sessionStorage.getItem("korpheal_is_dashboard") === "true";
    const isAtHome = String(form.collection_mode).toLowerCase().replace(/[\s-]+/g, "_") === "at_home";
    const userData = JSON.parse(sessionStorage.getItem("session_user") || "{}");
    const token = userData?.token;

    // -- Effects --

    // Listen for dashboard view changes
    useEffect(() => {
        const listener = () => setIsDashboardView(sessionStorage.getItem("korpheal_is_dashboard") === "true");
        window.addEventListener("storage", listener);
        return () => window.removeEventListener("storage", listener);
    }, []);

    // Fetch Settings
    useEffect(() => {
        axios.get(route("frontend.settings"))
            .then((res) => {
                const offset = res.data.data.settings.booking_open_offset_days;
                setSettings(res.data.data.settings || {});
                setBookingOffset(parseInt(offset) || 1);
            })
            .catch((err) => console.error("Error fetching settings:", err));
    }, []);

    // Restore Session Data
    useEffect(() => {
        const savedUser = sessionStorage.getItem("session_user");
        const savedCompany = sessionStorage.getItem("session_company");
        const savedForm = sessionStorage.getItem("korpheal_booking_data");
        const resumeStep = sessionStorage.getItem("korpheal_resume_step");

        if (savedUser && savedCompany) {
            try {
                const parsedUser = JSON.parse(savedUser);
                const parsedCompany = JSON.parse(savedCompany);

                setAuthenticated(true);
                setLoggedUser(parsedUser);
                setSelectedCompany(parsedCompany);

                setCompanyData({
                    company_name: parsedCompany.company_name,
                    logo: parsedCompany.logo || "",
                    offices: parsedCompany.offices,
                    hr_details: {
                        name: parsedUser.first_name || "HR Team",
                        email: parsedUser.email,
                        profile_image: "",
                        empid: `${parsedUser.id}`,
                        designation: parsedUser.role_title || "HR Admin",
                    },
                });

                const officeList = getOfficeListForUser(parsedUser, parsedCompany);
                setOfficeLocations(officeList);

                const firstAllowedOfficeName = officeList[0] || null;
                const firstAllowedOfficeObj = firstAllowedOfficeName ? findOfficeObjByName(parsedCompany, firstAllowedOfficeName) : null;
                setSelectedOffice(firstAllowedOfficeObj);

                if (savedForm) {
                    const parsedForm = JSON.parse(savedForm);
                    if (parsedForm.office_location && officeList.includes(parsedForm.office_location)) {
                        setForm((prev) => ({ ...prev, ...parsedForm }));
                        sessionStorage.setItem("korpheal_selected_office_name", parsedForm.office_location);
                        setCompanyData((prev) => ({ ...prev, display_center: parsedForm.office_location }));
                    } else {
                        const defaultOffice = officeList.length === 1 ? officeList[0] : "";
                        setForm((prev) => ({ ...prev, ...parsedForm, office_location: defaultOffice }));
                        if (officeList.length === 1) {
                            sessionStorage.setItem("korpheal_selected_office_name", officeList[0]);
                            setCompanyData((prev) => ({ ...prev, display_center: officeList[0] }));
                        }
                    }
                    if (parsedForm?.appointment_date) {
                        const iso = toISODateLocal(parsedForm.appointment_date);
                        if (iso) sessionStorage.setItem("appointment_date", iso);
                    }
                } else {
                    const defaultOffice = officeList.length === 1 ? officeList[0] : "";
                    setForm((prev) => ({
                        ...prev,
                        company_email: parsedUser?.email || "",
                        office_location: defaultOffice,
                    }));
                    if (officeList.length === 1) {
                        sessionStorage.setItem("korpheal_selected_office_name", officeList[0]);
                        setCompanyData((prev) => ({ ...prev, display_center: officeList[0] }));
                    }
                }

                if (resumeStep === "choose-mode") setStep(1);

            } catch (e) {
                console.error("Error parsing session data", e);
            }
        }
    }, []);

    // Prevent accidental closure & Handle Page Unload Logic
    useEffect(() => {
        let guardEnabled = true;
        window.__exitGuard = {
            enableExitGuard: () => { guardEnabled = true; },
            disableExitGuard: () => { guardEnabled = false; }
        };

        window.history.pushState({ guarded: true }, "", window.location.href);

        const handlePopState = () => {
            if (!guardEnabled || isSubmitting.current) return;
            const ok = window.confirm("Are you sure you want to close? All data will be removed!");
            if (!ok) {
                window.history.pushState({ guarded: true }, "", window.location.href);
                return;
            }
            sessionStorage.clear();
        };

        const handleBeforeUnload = (e) => {
            // 🟢 Stop alert if currently submitting data
            if (isSubmitting.current) return;

            // Stop alert on Login or Review step
            if (step === 0 || step === steps.length - 2) return;

            e.preventDefault();
            e.returnValue = "";
        };

        window.addEventListener("popstate", handlePopState);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("popstate", handlePopState);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [step]);

    useEffect(() => { generateCaptcha(); }, [step]);

    useEffect(() => {
        if (form?.appointment_date) {
            const iso = toISODateLocal(form.appointment_date);
            if (iso) sessionStorage.setItem("appointment_date", iso);
        }
    }, [form?.appointment_date]);

    useEffect(() => {
        if (!form.office_location || !selectedOffice?.collection_mode) return;
        const modes = String(selectedOffice.collection_mode).split(",").map((m) => m.trim()).filter(Boolean);

        if (modes.length === 1) {
            setForm((prev) => ({ ...prev, collection_mode: modes[0].toLowerCase() }));
        } else {
            setForm((prev) => ({ ...prev, collection_mode: prev.collection_mode || "" }));
        }
    }, [form.office_location, selectedOffice]);

    useEffect(() => {
        const updatePlacement = () => setPlacement(window.innerWidth >= 1024 ? "right-start" : "bottom-start");
        updatePlacement();
        window.addEventListener("resize", updatePlacement);
        return () => window.removeEventListener("resize", updatePlacement);
    }, []);


    // --- Logic & Handlers ---

    useEffect(() => {
        // If we are authenticated but the step is 0 (Login),
        // and we are NOT on the dashboard, force the step to 1 (Choose Mode).
        if (authenticated && step === 0 && !isDashboardView) {
            setStep(1);
        }
    }, [authenticated, step, isDashboardView]);

    const generateCaptcha = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "";
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setGeneratedCaptcha(code);
    };

    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const flashHighlight = (fields) => {
        const updates = {};
        fields.forEach((f) => { updates[f] = true; });
        setHighlightedFields((prev) => ({ ...prev, ...updates }));
        setTimeout(() => {
            const cleared = { ...highlightedFields };
            fields.forEach((f) => { delete cleared[f]; });
            setHighlightedFields(cleared);
        }, 2000);
    };

    const getInputClass = (fieldName) => {
        return highlightedFields[fieldName] ? "border-red-500" : "border-gray-300";
    };

    const goToStep = (stepNumber) => {
        setLoading(true);
        setTimeout(() => {
            setShowReviewModal(false);
            setStep(stepNumber);
            setLoading(false);
        }, 600);
    };

    const handleNext = () => {
        if (step === 3 && !isStep3Valid()) {
            alert("Please complete all required details.");
            return;
        }
        if (step < steps.length - 1) {
            setLoading(true);
            setTimeout(() => {
                setStep((prev) => prev + 1);
                setLoading(false);
            }, 600);
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setLoading(true);
            setTimeout(() => {
                setStep((prev) => prev - 1);
                setLoading(false);
            }, 600);
        }
    };

    const handleLogin = async () => {
        const email = form.company_email.trim();
        const password = form.company_password.trim();

        if (!email || !password) {
            alert("Please enter email and password.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(route("company-user.login"), { email, password });
            const res = response.data;

            if (res.success) {
                const user = res.user;
                const company = res.company_and_offices;

                sessionStorage.setItem("session_email", user.email);
                sessionStorage.setItem("session_user", JSON.stringify(user));
                sessionStorage.setItem("session_company", JSON.stringify(company));

                setAuthenticated(true);
                setLoggedUser(user);
                setSelectedCompany(company);
                setSelectedOffice(company.offices[0] || null);

                setCompanyData({
                    company_name: company.company_name,
                    logo: company.logo || "",
                    offices: company.offices,
                    hr_details: {
                        name: user.first_name || "HR Team",
                        email: user.email,
                        profile_image: "",
                        empid: `HR-${user.id}`,
                        designation: user.role_title || "HR Admin",
                    },
                });

                let officeList = getOfficeListForUser(user, company);
                setOfficeLocations(officeList);

                const firstOfficeObj = officeList[0] ? findOfficeObjByName(company, officeList[0]) : null;
                setSelectedOffice(firstOfficeObj);

                if (officeList.length === 1) {
                    setForm((prev) => ({ ...prev, office_location: officeList[0] }));
                    sessionStorage.setItem("korpheal_selected_office_name", officeList[0]);
                    setCompanyData((prev) => ({ ...prev, display_center: officeList[0] }));
                }
                setStep(1);
            } else {
                alert(res.message || "Login failed.");
            }
        } catch (err) {
            console.error("Login error:", err);
            alert(err.response?.data?.message || "Login failed due to server error.");
        } finally {
            setLoading(false);
        }
    };

    // Form Validation Logic
    const isEmployeeComplete = (emp) => {
        const requiredFields = ["id", "name", "age", "gender", "email", "phone"];
        if (isAtHome) requiredFields.push("home_address");

        const hasAllFields = requiredFields.every((field) => emp[field]?.toString().trim() !== "");
        const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(emp.email).trim());
        const isAgeValid = /^\d+$/.test(String(emp.age)) && Number(emp.age) >= 0;

        return hasAllFields && isEmailValid && isAgeValid;
    };

    const isDependentComplete = (dep) => {
        return (
            dep.name?.trim() &&
            dep.age?.toString().trim() &&
            dep.phone?.trim() &&
            dep.email?.trim() &&
            dep.gender?.trim()
        );
    };

    const allDependentsComplete = (emp) => {
        if (!emp.has_dependents) return true;
        const deps = Array.isArray(emp.dependents) ? emp.dependents : [];
        if (deps.length === 0) return false;
        return deps.every(isDependentComplete);
    };

    const isStep3Valid = () => {
        if (!Array.isArray(form.employees) || form.employees.length === 0) return false;
        if (isAtHome && !form.employees[0]?.home_address?.trim()) {
            alert("Please enter the Address (applies to all employees) on Employee #1.");
            return false;
        }

        for (let i = 0; i < form.employees.length; i++) {
            const emp = form.employees[i];
            if (!isEmployeeComplete(emp)) return false;

            if (emp.conditions.includes("Other") && !emp.other_condition?.trim()) {
                alert(`Please specify the 'Other' condition for Employee #${i + 1}.`);
                return false;
            }

            if (emp.has_dependents) {
                for (let j = 0; j < emp.dependents.length; j++) {
                    const dep = emp.dependents[j];
                    if (!isDependentComplete(dep)) return false;
                    if (dep.conditions.includes("Other") && !dep.other_condition?.trim()) {
                        alert(`Please specify the 'Other' condition for Dependent #${j + 1} of Employee #${i + 1}.`);
                        return false;
                    }
                }
            }
        }
        return true;
    };

    // Employee & Dependent Manipulation
    const makeBlankEmployee = () => ({
        id: "", name: "", age: "", gender: "", phone: "", home_address: "",
        designation: "N/A", email: "", relation: "N/A", conditions: [], other_condition: "",
        has_dependents: false, dependents: [], remarks: ""
    });

    const makeBlankDependent = () => ({
        name: "", age: "", gender: "", designation: "", phone: "", email: "",
        relation: "N/A", conditions: [], other_condition: ""
    });

    const addEmployee = () => {
        if (form.employees.length > 0) {
            const lastEmployee = form.employees[form.employees.length - 1];
            if (!isEmployeeComplete(lastEmployee) || !allDependentsComplete(lastEmployee)) {
                alert("Please complete the current employee details before adding another employee.");
                return;
            }
        }
        setForm((prev) => ({
            ...prev,
            employees: [...prev.employees, { ...makeBlankEmployee(), home_address: prev.address || "" }],
        }));
    };

    const updateEmployee = (i, field, value) => {
        const updated = [...form.employees];
        updated[i][field] = value;
        setForm((prev) => ({ ...prev, employees: updated }));
    };

    const handleDeleteEmployee = (index) => {
        const updatedEmployees = [...form.employees];
        updatedEmployees.splice(index, 1);
        setForm((prev) => ({ ...prev, employees: updatedEmployees }));
    };

    const handleToggleDependents = (empIndex, checked) => {
        const employees = [...form.employees];
        const emp = employees[empIndex];

        if (!checked) {
            if (emp.dependents && emp.dependents.length > 0) {
                alert("Please remove all dependent sections first.");
                return;
            }
            employees[empIndex] = { ...emp, has_dependents: false };
        } else {
            const nextDeps = emp.dependents && emp.dependents.length > 0 ? emp.dependents : [makeBlankDependent()];
            employees[empIndex] = { ...emp, has_dependents: true, dependents: nextDeps };
        }
        setForm((prev) => ({ ...prev, employees }));
    };

    const addDependent = (empIndex) => {
        const updated = [...form.employees];
        const dependents = updated[empIndex].dependents;
        if (dependents.length === 0 || isDependentComplete(dependents[dependents.length - 1])) {
            dependents.push(makeBlankDependent());
            setForm((prev) => ({ ...prev, employees: updated }));
        } else {
            alert("Please complete the previous dependent's details before adding a new one.");
        }
    };

    const updateDependent = (empIndex, depIndex, field, value) => {
        const updated = [...form.employees];
        updated[empIndex].dependents[depIndex][field] = value;
        setForm((prev) => ({ ...prev, employees: updated }));
    };

    const handleDeleteDependent = (empIndex, depIndex) => {
        const employees = [...form.employees];
        const emp = employees[empIndex];
        const nextDeps = emp.dependents.filter((_, idx) => idx !== depIndex);
        employees[empIndex] = { ...emp, has_dependents: nextDeps.length > 0 ? emp.has_dependents : false, dependents: nextDeps };
        setForm((prev) => ({ ...prev, employees }));
    };

    // Submission Logic
    const buildBookingPayload = ({ form, selectedCompany, selectedOffice, loggedUser, bookingMode }) => {
        const rawMode = (Array.isArray(form.collection_mode) ? form.collection_mode[0] : form.collection_mode) || "";
        const normalizedMode = rawMode.toLowerCase().replace(/[\s-]+/g, "_");
        const isAtHome = normalizedMode === "at_home";

        const company_id = selectedCompany?.id ?? selectedCompany?.company_id ?? null;

        const pickOfficeIdByName = (company, officeName) => {
            if (!company || !Array.isArray(company.offices)) return null;
            const hit = company.offices.find((o) => o.office_name === officeName);
            return hit?.id ?? hit?.office_id ?? null;
        };

        const office_id = pickOfficeIdByName(selectedCompany, form.office_location) ?? selectedOffice?.id ?? selectedOffice?.office_id ?? null;
        const company_user_id = loggedUser?.id ?? null;

        const pref_appointment_date = (() => {
            const fromSession = sessionStorage.getItem("appointment_date");
            if (fromSession) return fromSession;
            return toISODateLocal(form?.appointment_date);
        })();

        const normalizeConditions = (arr = [], other = "") => {
            const list = Array.isArray(arr) ? arr : [];
            return other && other.trim() ? [...list, other.trim()] : list;
        };

        const employees = (Array.isArray(form.employees) ? form.employees : [])
            .filter((e) => (e?.name && e.name.trim()) || (e?.email && e.email.trim()) || (e?.phone && e.phone.trim()))
            .map((e) => ({
                id: e.id || null,
                name: e.name || null,
                email: e.email || null,
                phone: e.phone || null,
                gender: e.gender || null,
                age: e.age || null,
                dob: e.dob ? toISODate(e.dob) : null,
                designation: e.designation || null,
                home_address: isAtHome ? (e.home_address?.trim() ? e.home_address.trim() : null) : null,
                medical_conditions: normalizeConditions(e.conditions, e.other_condition),
                remarks: e.remarks || "",
                dependents: (Array.isArray(e.dependents) ? e.dependents : [])
                    .filter((d) => d?.name || d?.gender || d?.age || d?.email || d?.phone)
                    .map((d) => ({
                        name: d.name || null,
                        gender: d.gender || null,
                        age: d.age && `${d.age}`.trim() !== "" ? Number(d.age) : null,
                        email: d.email || null,
                        phone: d.phone || null,
                        medical_conditions: normalizeConditions(d.conditions, d.other_condition),
                        remarks: d.remarks || "",
                    })),
            }));

        return {
            company_id,
            office_id,
            collection_mode: form.collection_mode || null,
            company_user_id,
            booking_mode: bookingMode || (form.csv_file ? "csv_upload" : "online_form"),
            pref_appointment_date,
            notes: form.notes || "",
            employees,
            user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
            user_ip: null,
            client_session_id: sessionStorage.getItem("client_session_id") || (() => {
                const id = uuid4();
                try { sessionStorage.setItem("client_session_id", id); } catch {}
                return id;
            })(),
            brn: null,
            status: null,
            dos: null,
        };
    };

    const handleSubmitBooking = async () => {
        const formattedDate = format(new Date(), "dd-MM-yyyy HH:mm:ss");
        sessionStorage.setItem("submission_time", formattedDate);

        if (!form?.captcha) {
            alert("Please fill the captcha first.");
            return;
        }

        try {
            setLoading(true);
            await axios.get("/sanctum/csrf-cookie", { withCredentials: true });

            const collectionMode = (form?.collection_mode || "").toLowerCase();
            const payload = buildBookingPayload({
                form: { ...form, collection_mode: collectionMode },
                selectedCompany,
                selectedOffice,
                loggedUser,
                bookingMode,
            });

            // Ensure address sync
            if (Array.isArray(payload.employees)) {
                payload.employees = payload.employees.map((emp) => ({
                    ...emp,
                    home_address: collectionMode === "at_home" ? (emp.home_address && emp.home_address.trim() !== "" ? emp.home_address : null) : null,
                }));
            }

            const baseUrl = route("frontbooking.store");
            // 🟢 3. Restore testFail logic here
            const testFail = false; // Set to true to test failure scenario
            const storeUrl = testFail ? `${baseUrl}?fail_test=1` : baseUrl;

            const axiosConfig = { headers: { Authorization: `Bearer ${token || ""}` }, withCredentials: true };

            let response;
            if (form.csv_file) {
                const fd = new FormData();
                fd.append("payload", JSON.stringify(payload));
                fd.append("csv_file", form.csv_file);
                response = await axios.post(storeUrl, fd, { ...axiosConfig, headers: { ...axiosConfig.headers, "Content-Type": "multipart/form-data" } });
            } else {
                response = await axios.post(storeUrl, payload, { ...axiosConfig, headers: { ...axiosConfig.headers, "Content-Type": "application/json" } });
            }

            const res = response?.data;
            const reqDate = res?.data?.request_date || res?.request_date || null;
            if (reqDate) sessionStorage.setItem("request_date", reqDate);

            const excelDownloadUrl = pickExcelUrl(res);
            if (excelDownloadUrl) sessionStorage.setItem("excel_download_url", excelDownloadUrl);

            const refNo = res?.data?.booking_ref || res?.booking_ref || "";
            const bookingId = res?.data?.booking_id || res?.booking_id || "";
            const clientSessionId = sessionStorage.getItem("client_session_id") || bookingId || "";
            const applicantId = res?.data?.applicants?.[0]?.id || null;
            if (applicantId) sessionStorage.setItem("applicant_id", applicantId);

            if (res?.success) {
                const status = res?.booking_status || res?.data?.booking_status || "";
                sessionStorage.setItem("booking_status", status);
                setBookingRef(refNo);
                setSubmissionSuccess(true);
                setPopupType("success");
                setPopupVisible(true);
                setBookingStatus(status);

                sessionStorage.setItem("korpheal_booking_data", JSON.stringify(form));
                sessionStorage.setItem("korpheal_company_data", JSON.stringify(companyData));

                // 🟢 4. Set submitting flag to bypass alert
                isSubmitting.current = true;

                setTimeout(() => {
                    setPopupVisible(false);
                    const employeesCount = payload.employees.length;
                    const dependentsCount = payload.employees.reduce((sum, e) => sum + (e.dependents?.length || 0), 0);

                    const summaryForThankYou = {
                        booking_ref: refNo || "",
                        booking_status: status || "success",
                        request_date: reqDate || null,
                        company: selectedCompany?.company_name || "",
                        office: form?.office_location || "",
                        collection_mode: collectionMode || "",
                        employees_count: employeesCount,
                        dependents_count: dependentsCount,
                        applicant_summary: employeesCount + dependentsCount,
                        submitted_by: loggedUser?.email || form?.company_email || "",
                        submitted_at: new Date().toISOString(),
                        booking_id: bookingId || null,
                    };

                    sessionStorage.setItem("korpheal_last_summary", JSON.stringify(summaryForThankYou));
                    window.__exitGuard?.disableExitGuard();
                    window.location.assign(route("thankyou.page", { brn: refNo, status: "success" }));
                }, 3000);
            } else {
                throw new Error("Submission success flag is false");
            }
        } catch (err) {
            console.error("Booking submission error:", err);
            const errRes = err?.response?.data;
            const excelFromError = pickExcelUrl(errRes);
            if (excelFromError) sessionStorage.setItem("excel_download_url", excelFromError);

            setPopupType("error");
            setPopupVisible(true);
            sessionStorage.setItem("korpheal_booking_data", JSON.stringify(form));
            sessionStorage.setItem("korpheal_company_data", JSON.stringify(companyData));

            setTimeout(() => {
                setPopupVisible(false);
                window.location.assign(route("failed.page", {
                    sid: sessionStorage.getItem("client_session_id") || null,
                    dos: Math.floor(Date.now() / 1000).toString(),
                    status: "failed",
                }));
            }, 3000);
        } finally {
            setLoading(false);
        }
    };

    const getSelectedCollectionModeLabel = () => {
        const m = form?.collection_mode || "N/A";
        return m ? m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";
    };

    const fillFromDemo = (email, password) => {
        setForm((prev) => ({ ...prev, company_email: email, company_password: password }));
        requestAnimationFrame(() => {
            const pwd = document.querySelector('input[name="company_password"]');
            if (pwd) pwd.focus();
        });
    };

    const handlePrintModal = () => {
        const modal = document.getElementById("print-modal");
        if (!modal) { window.print(); return; }
        modal.classList.add("print-only");
        window.print();
        setTimeout(() => modal.classList.remove("print-only"), 1000);
    };

    // --- Render ---

    const Loader = () => (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-lg font-medium text-gray-600">Please wait...</p>
        </div>
    );

    return loading ? <Loader /> : (
        <>
            <style>{printOnlyStyle}</style>
            <Head>
                <title>{`${settings.application_name} Health Check Booking`}</title>
                <link rel="icon" type="image/png" href={`${settings.application_favicon}`} />
            </Head>

            <div className="flex flex-col min-h-screen">
                <div className="sticky top-0 z-30 bg-white shadow-sm">
                    <Header
                        authenticated={authenticated}
                        settings={settings}
                        companyData={companyData}
                        currentStep={step}
                        steps={steps}
                        isDashboardView={isDashboardView}
                    />
                </div>
                <main className="flex-1 overflow-y-auto">
                    {isDashboardView ? (
                        <Dashboard offices={officeLocations} companyData={companyData} loggedUser={loggedUser} />
                    ) : step === 0 ? (
                        <div className="flex items-center justify-center px-6 py-12 w-full min-h-[calc(100vh-120px)]">
                            <div className="w-full max-w-xl mx-auto">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Log in to Your Corporate Account</h2>
                                </div>
                                <div className="text-center">
                                    <div className="bg-transparent log_in p-6 md:p-8 space-y-6 rounded-md shadow-sm">
                                        <div className="text-left">
                                            <label className="block text-lg font-semibold text-gray-800 mb-2">Email <span className="text-red-600">*</span></label>
                                            <input
                                                name="company_email"
                                                type="email"
                                                value={form.company_email}
                                                onChange={handleChange}
                                                className="w-full px-5 py-3 border border-gray-300 rounded-md shadow-sm text-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="Enter your company email"
                                                required
                                            />
                                        </div>
                                        <div className="text-left relative form_mar">
                                            <label className="block text-lg font-semibold text-gray-800 mb-2">Password <span className="text-red-600">*</span></label>
                                            <input
                                                name="company_password"
                                                type={showPassword ? "text" : "password"}
                                                value={form.company_password}
                                                onChange={handleChange}
                                                className="w-full px-5 py-3 border border-gray-300 rounded-md shadow-sm text-lg focus:ring-2 focus:ring-blue-500 pr-12"
                                                placeholder="Enter your password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-3 top-[36px] flex items-center text-gray-500 hover:text-gray-700"
                                            >
                                                {showPassword ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.958 9.958 0 012.212-3.592M6.343 6.343A9.955 9.955 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.957 9.957 0 01-4.105 5.057M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                                                )}
                                            </button>
                                        </div>
                                        <div className="text-center">
                                            <button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-700 text-white text-lg all_btn_sm font-bold px-10 py-3 rounded-md transition duration-200">Login →</button>
                                        </div>
                                    </div>
                                    <p className="text-base text-gray-600 mt-6">**Access your company’s wellness booking dashboard. Authorized representatives only.</p>
                                </div>
                                {/* Hidden Demo Credentials */}
                                <div className="mt-6" hidden>
                                    <div className="bg-white border border-gray-200 rounded-lg shadow p-3">
                                        <h4 className="text-xs font-semibold text-gray-800 mb-1 justify-center text-center">Demo Credentials</h4>
                                        <div className="max-h-40 overflow-auto pr-1 text-left">
                                            {demoCredentials.map((c) => {
                                                const officesWithUsers = c.offices.filter((o) => o.users.length > 0);
                                                if (officesWithUsers.length === 0) return null;
                                                return (
                                                    <div key={c.company} className="mb-2">
                                                        <div className="text-[12px] font-bold text-blue-700">Company: {c.company}</div>
                                                        {officesWithUsers.map((o) => (
                                                            <div key={o.name} className="mt-0.5 ml-3">
                                                                <div className="text-[11px] font-medium text-gray-700">Office: {o.name}</div>
                                                                <ul className="ml-4 mt-0.5 space-y-0.5">
                                                                    {o.users.map((u) => (
                                                                        <li key={u.email}>
                                                                            <button type="button" onClick={() => fillFromDemo(u.email, u.password)} className="w-full text-left text-[11px] leading-snug rounded px-2 py-1 hover:bg-blue-50 hover:text-blue-700 transition" title="Click to autofill">
                                                                                <div className="font-semibold flex items-center gap-1">{u.name} <span className="text-gray-500 text-[10px] flex items-center gap-1">({roleMap[u.role_id]}) <span className="relative group cursor-pointer" title={roleDescriptions[u.role_id]}><FaInfoCircle className="text-blue-500 text-[10px]" /></span></span></div>
                                                                                <div className="text-[10px] text-gray-600">Email: <span className="font-mono">{u.email}</span></div>
                                                                                <div className="text-[10px] text-gray-600">Password: <span className="font-mono">{u.password}</span></div>
                                                                            </button>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full flex items-center justify-center m_height min-h-[400px]">
                            <div className="flex items-center justify-center d_w_f">
                                <div className="padd-0 p-6 text-sm text-gray-800 leading-relaxed mobil_pa">
                                    {steps.map((label, panelStep) => (
                                        <div key={panelStep} className={step === panelStep ? "block" : "hidden"}>
                                            {/* Step 1: Mode Selection */}
                                            {panelStep === 1 && authenticated && (
                                                <div className="w-full px-6 flex items-center justify-center">
                                                    <div className="w-full max-w-3xl text-center">
                                                        <h3 className="text-3xl men_heading font-extrabold text-blue-700 mb-3">Welcome, {companyData?.hr_details?.name || ""}</h3>
                                                        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-5 sm:whitespace-nowrap whitespace-normal">Please select the following option for your employees’ health check-up booking:</p>
                                                        <div className="flex gap-6 flex-wrap all_btn justify-center">
                                                            <button className="bg-gray-400 d-none text-white text-lg px-6 py-3 rounded-lg font-semibold shadow cursor-not-allowed" disabled onClick={() => { setBookingMode("csv"); setStep(2); }}>
                                                                <FontAwesomeIcon icon={faUpload} className="text-white text-xl" /> CSV Upload
                                                            </button>
                                                            <button className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-6 py-3 rounded-lg font-semibold shadow" onClick={() => { setBookingMode("online"); setStep(2); }}>
                                                                <FontAwesomeIcon icon={faGlobe} className="text-white text-xl" /> Online Submission
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Step 2: Appointment Info */}
                                            {panelStep === 2 && authenticated && (
                                                <div className="flex flex-col mobil_pa items-center justify-center text-center py-5">
                                                    <h2 className="text-3xl form_heading font-semibold text-blue-700 mb-8 tracking-wide">Appointment Details</h2>
                                                    <div className="w-full max-w-2xl text-left">
                                                        <div className="app_details bg-transparent p-6 md:p-8 space-y-6 rounded-md shadow-sm">
                                                            <div>
                                                                <label className="block text-lg font-semibold text-gray-800 mb-2">Choose Centre <span className="text-red-600">*</span></label>
                                                                {officeLocations.length === 1 ? (
                                                                    <><input type="text" value={officeLocations[0]} readOnly className="w-full border rounded-md px-5 py-3 text-lg shadow-sm bg-gray-100 cursor-not-allowed" /><input type="hidden" name="office_location" value={officeLocations[0]} /></>
                                                                ) : (
                                                                    <select
                                                                        name="office_location"
                                                                        value={form.office_location}
                                                                        onChange={(e) => {
                                                                            handleChange(e);
                                                                            const name = e.target.value || "";
                                                                            sessionStorage.setItem("korpheal_selected_office_name", name);
                                                                            setCompanyData((prev) => ({ ...prev, display_center: name }));
                                                                            const officeObj = findOfficeObjByName(selectedCompany, name);
                                                                            setSelectedOffice(officeObj || null);
                                                                            setForm((prev) => ({ ...prev, collection_mode: "" }));
                                                                        }}
                                                                        className={`w-full border rounded-md px-5 py-3 text-lg shadow-sm ${getInputClass("office_location")}`}
                                                                    >
                                                                        <option value="">Select Your Office</option>
                                                                        {officeLocations.map((loc, idx) => <option key={idx} value={loc}>{loc}</option>)}
                                                                    </select>
                                                                )}
                                                            </div>

                                                            {/* Collection Mode Logic */}
                                                            {form.office_location && selectedOffice?.collection_mode && (() => {
                                                                const modes = String(selectedOffice.collection_mode).split(",").map(m => m.trim()).filter(Boolean);
                                                                if (!modes.length) return null;
                                                                if (modes.length === 1) {
                                                                    const onlyMode = modes[0].toLowerCase();
                                                                    if (onlyMode === "at_home") {
                                                                        return <div className="mt-4"><label className="block text-lg font-semibold text-gray-800 mb-2">Preferred Collection Type: <span className="text-red-600">*</span></label><input type="text" value="At Home" readOnly className="w-full border rounded-md px-5 py-3 text-lg shadow-sm bg-gray-100 cursor-not-allowed" /><input type="hidden" name="collection_mode" value="at_home" /></div>;
                                                                    }
                                                                    if (onlyMode === "at_clinic") {
                                                                        return <input type="hidden" name="collection_mode" value="at_clinic" />;
                                                                    }
                                                                }
                                                                return (
                                                                    <div className="mt-4">
                                                                        <label className="block text-lg font-semibold text-gray-800 mb-2">Preferred Collection Type: <span className="text-red-600">*</span></label>
                                                                        <select className="w-full px-4 py-2 rounded border border-gray-300" value={form.collection_mode || ""} onChange={(e) => setForm(prev => ({ ...prev, collection_mode: e.target.value.toLowerCase() }))}>
                                                                            <option value="">-- Select Collection Type --</option>
                                                                            {modes.map((mode, idx) => <option key={idx} value={mode.toLowerCase()}>{mode.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                                                                        </select>
                                                                    </div>
                                                                );
                                                            })()}

                                                            <div className="s_form_padiing">
                                                                <label className="block text-lg font-semibold text-gray-800 mb-2">Appointment Request Date</label>
                                                                <DatePicker
                                                                    selected={form.appointment_date}
                                                                    onChange={(date) => {
                                                                        setForm(prev => ({ ...prev, appointment_date: date }));
                                                                        if (date) sessionStorage.setItem("appointment_date", format(date, "dd-MM-yyyy"));
                                                                        else sessionStorage.removeItem("appointment_date");
                                                                    }}
                                                                    placeholderText="Select a date"
                                                                    className="w-full px-5 py-3 text-base sm:text-lg border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                                    dateFormat="dd-MM-yyyy"
                                                                    minDate={addDays(startOfDay(new Date()), bookingOffset)}
                                                                    popperPlacement={placement}
                                                                    popperClassName="z-50"
                                                                    dayClassName={(date) => date.getDay() === 0 && date < addDays(startOfDay(new Date()), bookingOffset) ? "react-datepicker__day--past-sunday" : date.getDay() === 0 ? "react-datepicker__day--sunday" : undefined}
                                                                    calendarContainer={({ className, children }) => (
                                                                        <div className={`${className} w-[95%] sm:w-auto max-w-[350px]`}>
                                                                            {children}
                                                                            <div className="text-[10px] text-gray-600 italic text-center p-0.5 border-t">**Sundays and holidays subject to availability</div>
                                                                        </div>
                                                                    )}
                                                                />
                                                            </div>

                                                            {bookingMode === "csv" && (
                                                                <div>
                                                                    <label className="block text-lg font-semibold text-gray-800 mb-2">Upload CSV File</label>
                                                                    <input type="file" accept=".csv" onChange={(e) => {
                                                                        const file = e.target.files[0];
                                                                        if (file && file.type === "text/csv") setForm(prev => ({ ...prev, csv_file: file }));
                                                                        else { alert("Please upload a valid CSV file."); e.target.value = null; }
                                                                    }} className="block w-full text-lg text-gray-800 file:mr-4 file:py-3 file:px-6 file:rounded-md file:border-0 file:text-lg file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                                                    {form.csv_file && <p className="text-green-600 text-base mt-2 font-medium">Selected File: {form.csv_file.name}</p>}
                                                                </div>
                                                            )}

                                                            <div className="s_form_padiing">
                                                                <label className="block text-lg font-semibold text-gray-800 mb-2">Notes: (If Any)</label>
                                                                <textarea name="notes" value={form.notes || ""} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Any booking notes for our team" rows={3} className="w-full px-5 py-3 text-base sm:text-lg border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Step 3: Employee Details */}
                                            {panelStep === 3 && authenticated && (
                                                <div className="bg-white px-6 py-10 bg_shadow e_information p_relative w-full rounded-[10px]">
                                                    <h2 className="text-3xl form_heading font-semibold text-blue-700 mb-6 tracking-wide text-center">Employee Details</h2>
                                                    <div className="w-full max-w-5xl space-y-10 all_btn">
                                                        {form.employees.map((emp, i) => (
                                                            <div key={i} className="relative border border-gray-300 bg-transparent p-4 md:p-6 space-y-4">
                                                                {form.employees.length > 1 && (
                                                                    <button type="button" onClick={() => { if (window.confirm("Do you really want to delete this employee?")) handleDeleteEmployee(i); }} className="absolute top-2 right-3 inline-flex h-8 clos_button w-8 items-center justify-center rounded-full text-gray-500 hover:text-red-600 hover:bg-red-50 text-2xl leading-none" title="Remove Employee">
                                                                        &times;
                                                                    </button>
                                                                )}
                                                                <h3 className="text-2xl font-semibold text-gray-800 mb-4">#{i + 1} Employee Details <span className="text-red-600">*</span></h3>

                                                                {/* Basic Info */}
                                                                <div className="grid md:grid-cols-2 gap-6">
                                                                    <div>
                                                                        <label className="text-lg font-semibold text-gray-800 mb-1 block">Employee ID <span className="text-red-600">*</span></label>
                                                                        <input className={`border px-5 py-3 rounded-md text-lg w-full ${getInputClass(`emp-${i}-id`)}`} placeholder="Employee ID" value={emp.id} onChange={(e) => updateEmployee(i, "id", e.target.value)} />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-lg font-semibold text-gray-800 mb-1 block">Name <span className="text-red-600">*</span></label>
                                                                        <input className={`border px-5 py-3 rounded-md text-lg w-full ${getInputClass(`emp-${i}-name`)}`} placeholder="Name" value={emp.name} onChange={(e) => updateEmployee(i, "name", e.target.value)} />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-lg font-semibold text-gray-800 mb-1 block">Age <span className="text-red-600">*</span></label>
                                                                        <input type="number" inputMode="numeric" min={0} step={1} className={`border px-5 py-3 rounded-md text-lg w-full ${getInputClass(`emp-${i}-age`)}`} placeholder="Age" value={emp.age} onChange={(e) => updateEmployee(i, "age", e.target.value.replace(/[^0-9]/g, ""))} onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()} onWheel={(e) => e.currentTarget.blur()} />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-lg font-semibold mb-2 block">Gender <span className="text-red-600">*</span></label>
                                                                        <div className={`flex gap-6 text-lg p-2 rounded ${getInputClass(`emp-${i}-gender`)}`}>
                                                                            {["Male", "Female"].map((g) => (
                                                                                <label key={g} className="flex items-center gap-2">
                                                                                    <input type="radio" name={`gender-${i}`} value={g} checked={emp.gender === g} onChange={() => updateEmployee(i, "gender", g)} /> {g}
                                                                                </label>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-lg font-semibold text-gray-800 mb-1 block">Email <span className="text-red-600">*</span></label>
                                                                        <input type="email" required className={`border px-5 py-3 rounded-md text-lg w-full ${getInputClass(`emp-${i}-email`)}`} placeholder="Email" value={emp.email} pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$" onChange={(e) => updateEmployee(i, "email", e.target.value.trim())} />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-lg font-semibold text-gray-800 mb-1 block">Mobile <span className="text-red-600">*</span></label>
                                                                        <input type="tel" inputMode="numeric" maxLength={10} required className={`border px-5 py-3 rounded-md text-lg w-full ${getInputClass(`emp-${i}-phone`)}`} placeholder="Mobile Number" value={emp.phone} onChange={(e) => updateEmployee(i, "phone", e.target.value.replace(/[^0-9]/g, ""))} />
                                                                    </div>
                                                                    {(form.collection_mode === "at_home" || form.collection_mode === "At-Home" || form.collection_mode?.[0] === "at_home") && (
                                                                        <div className="md:col-span-2">
                                                                            <label className="text-lg font-semibold text-gray-800 mb-1 block">Address <span className="text-red-600">*</span></label>
                                                                            <input className={`border px-5 py-3 rounded-md text-lg w-full ${getInputClass(`emp-${i}-home_address`)}`} placeholder="Address" value={emp.home_address || ""} onChange={(e) => updateEmployee(i, "home_address", e.target.value)} />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Conditions */}
                                                                <div>
                                                                    <label className="block text-lg font-semibold mt-4 mb-2">Pre-existing Conditions</label>
                                                                    <div className="grid md:grid-cols-3 gap-2 text-lg">
                                                                        {["Diabetes", "Hypertension", "Respiratory ailments", "Heart ailments", "Kidney ailments", "Allergy", "Other"].map((cond) => (
                                                                            <label key={cond} className="flex items-center gap-2">
                                                                                <input type="checkbox" checked={emp.conditions.includes(cond)} onChange={(e) => {
                                                                                    const newConditions = e.target.checked ? [...emp.conditions, cond] : emp.conditions.filter((c) => c !== cond);
                                                                                    updateEmployee(i, "conditions", newConditions);
                                                                                }} /> {cond}
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                    {emp.conditions.includes("Other") && (
                                                                        <input className={`mt-4 border px-5 py-3 rounded-md text-lg w-full ${getInputClass(`emp-${i}-phone`)}`} placeholder="Please specify other condition*" value={emp.other_condition || ""} onChange={(e) => updateEmployee(i, "other_condition", e.target.value)} required />
                                                                    )}
                                                                </div>

                                                                {/* Dependents Section */}
                                                                <div className="mt-4">
                                                                    <div className="mt-2">
                                                                        <label className="font-semibold text-sm">Want to add Dependents for this Employee? <input type="checkbox" checked={emp.has_dependents} onChange={(e) => handleToggleDependents(i, e.target.checked)} className="ml-2" /></label>
                                                                    </div>
                                                                    {emp.has_dependents && emp.dependents?.length > 0 && emp.dependents.map((dep, j) => (
                                                                        <div key={j} className="mt-6 border-l-4 border-blue-300 px-6 py-4 relative bg-blue-50 rounded-md space-y-4">
                                                                            <div className="flex justify-end student_close">
                                                                                <button type="button" onClick={() => { if (window.confirm("Do you really want to delete this dependent?")) handleDeleteDependent(i, j); }} className="text-gray-500 clos_button hover:text-red-600 text-2xl font-bold" title="Remove Dependent">&times;</button>
                                                                            </div>
                                                                            <h4 className="text-xl font-bold text-blue-700">#{j + 1} Dependent Details</h4>
                                                                            <div className="grid md:grid-cols-2 gap-4">
                                                                                <div>
                                                                                    <label className="text-lg font-semibold text-gray-800 mb-1 block">Name <span className="text-red-600">*</span></label>
                                                                                    <input required className={`border px-5 py-3 rounded text-lg w-full ${getInputClass(`dep-${i}-${j}-name`)}`} placeholder="Name" value={dep.name} onChange={(e) => updateDependent(i, j, "name", e.target.value)} />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-lg font-semibold text-gray-800 mb-1 block">Age <span className="text-red-600">*</span></label>
                                                                                    <input type="number" required inputMode="numeric" min={0} step={1} className={`border px-5 py-3 rounded text-lg w-full ${getInputClass(`dep-${i}-${j}-age`)}`} placeholder="Age" value={dep.age} onChange={(e) => updateDependent(i, j, "age", e.target.value.replace(/[^0-9]/g, "").slice(0, 10))} onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()} onWheel={(e) => e.currentTarget.blur()} />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-lg font-semibold text-gray-800 mb-1 block">Mobile <span className="text-red-600">*</span></label>
                                                                                    <input type="tel" required inputMode="numeric" maxLength={10} className={`border px-5 py-3 rounded-md text-lg w-full ${getInputClass(`dep-${i}-${j}-phone`)}`} placeholder="Mobile Number" value={dep.phone} onChange={(e) => updateDependent(i, j, "phone", e.target.value.replace(/[^0-9]/g, ""))} />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-lg font-semibold text-gray-800 mb-1 block">Email <span className="text-red-600">*</span></label>
                                                                                    <input type="email" required className="border px-5 py-3 rounded text-lg w-full" placeholder="Email" value={dep.email} pattern="^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" onChange={(e) => updateDependent(i, j, "email", e.target.value.trim())} />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-lg font-semibold text-gray-800 mb-1 block">Gender <span className="text-red-600">*</span></label>
                                                                                    <div className={`flex gap-6 text-lg p-2 rounded ${getInputClass(`dep-${i}-${j}-gender`)}`}>
                                                                                        {["Male", "Female"].map((g) => (
                                                                                            <label key={g} className="flex items-center gap-2">
                                                                                                <input type="radio" required name={`dep-gender-${i}-${j}`} value={g} checked={dep.gender === g} onChange={() => updateDependent(i, j, "gender", g)} /> {g}
                                                                                            </label>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-lg font-semibold mt-4 mb-2">Pre-existing Conditions</label>
                                                                                <div className="grid md:grid-cols-3 gap-2 text-lg">
                                                                                    {["Diabetes", "Hypertension", "Respiratory ailments", "Heart ailments", "Kidney ailments", "Allergy", "Other"].map((cond) => (
                                                                                        <label key={cond} className="flex items-center gap-2">
                                                                                            <input type="checkbox" checked={dep.conditions.includes(cond)} onChange={(e) => {
                                                                                                const newConds = e.target.checked ? [...dep.conditions, cond] : dep.conditions.filter((c) => c !== cond);
                                                                                                updateDependent(i, j, "conditions", newConds);
                                                                                            }} /> {cond}
                                                                                        </label>
                                                                                    ))}
                                                                                </div>
                                                                                {dep.conditions.includes("Other") && (
                                                                                    <input className="mt-3 border px-5 py-3 rounded text-lg w-full" placeholder="Please specify other condition*" value={dep.other_condition || ""} onChange={(e) => updateDependent(i, j, "other_condition", e.target.value)} required />
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    {emp.has_dependents && emp.dependents.length < 10 && (
                                                                        <button onClick={() => addDependent(i)} className="mt-6 text-lg bg-blue-600 text-white px-5 py-2 rounded shadow">+ Add Dependent</button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <div className="mt-4 mb-2 all_btn text-center">
                                                            <button onClick={addEmployee} className="text-lg bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow">+ Add Another Employee</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Step 5: Review & Submit */}
                                            {panelStep === steps.length - 2 && (
                                                <div className="flex form_under_p flex-col items-center justify-center bg_shadow px-10 rounded-[10px] py-10 bg-white">
                                                    <h2 className="text-3xl md:text-4xl font-semibold text-blue-700 mb-8 text-center">Review & Submit</h2>
                                                    <div className="w-full max-w-4xl border border-gray-300 bg-transparent p-6 md:p-8 space-y-5 rounded-md shadow-sm text-base">
                                                        <div className="flex flex-wrap gap-4 justify-center">
                                                            <button onClick={() => setShowReviewModal(true)} className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded font-semibold">Review / Edit</button>
                                                        </div>
                                                        <p className="text-gray-700 text-lg">Review your details and make any necessary changes before submission.</p>
                                                        <div>
                                                            <label className="block font-semibold text-gray-800 mb-1 text-base">Verify captcha to submit <span className="text-red-600">*</span></label>
                                                            <div className="flex items-center gap-4">
                                                                <div className="bg-gray-200 text-xl tracking-widest px-6 py-2 rounded font-mono">{generatedCaptcha}</div>
                                                                <button type="button" onClick={generateCaptcha} className="text-blue-600 underline text-sm font-medium">Refresh</button>
                                                            </div>
                                                            <input type="text" name="captcha" placeholder="Enter Captcha *" value={form.captcha} onChange={handleChange} className={`mt-3 w-full px-4 py-2 rounded text-base border ${getInputClass("captcha")}`} />
                                                        </div>
                                                        <div className="text-center mt-4">
                                                            <button onClick={handleSubmitBooking} className={`px-6 py-2 rounded text-base font-bold text-white bg-green-600 hover:bg-green-700`}>Submit My Proposal</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Review Modal */}
                                            {showReviewModal && (
                                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4 py-8">
                                                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl pt-0 rev_padd p-10 overflow-y-auto max-h-[90vh] border border-gray-300 text-lg relative">
                                                        <div className="flex justify-between items-center review_sub border-b pb-6 mb-8">
                                                            <h5 className="text-3xl font-semibold text-gray-900 tracking-wide">Review Your Submission</h5>
                                                            <button onClick={() => setShowReviewModal(false)} className="text-gray-500 hover:text-black text-1xl font-bold transition-colors" title="Close">✕</button>
                                                        </div>
                                                        <div className="space-y-12 text-gray-800 pr-2">
                                                            <section className="bg-gray-50 p-6 rounded-xl com_info border shadow-sm hover:shadow-md transition-shadow">
                                                                <div className="flex justify-between items-center mb-4 info">
                                                                    <h4 className="font-semibold text-blue-800 text-2xl">Company Info</h4>
                                                                    <button onClick={() => goToStep(2)} className="text-blue-600 text-lg hover:underline">Edit</button>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
                                                                    {form.company_email?.email && <p><strong>Email:</strong> {form.company_email?.email}</p>}
                                                                    {form.office_location && <p><strong>Office/Center/Unit:</strong> {form.office_location}</p>}
                                                                    {form.collection_mode?.[0] && <p><strong>Preferred Collection Type:</strong> {getSelectedCollectionModeLabel()}</p>}
                                                                    {form.appointment_date && <p><strong>Appointment Date:</strong> {(() => { const date = new Date(form.appointment_date); return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`; })()}</p>}
                                                                    {form.notes && <p><strong>Notes:</strong> {form.notes}</p>}
                                                                </div>
                                                            </section>
                                                            <section className="bg-gray-50 p-6 rounded-xl border com_info shadow-sm hover:shadow-md transition-shadow">
                                                                <div className="flex justify-between items-center mb-4 info">
                                                                    <h4 className="font-semibold text-blue-800 text-2xl">Employees</h4>
                                                                    <button onClick={() => goToStep(3)} className="text-blue-600 text-lg hover:underline">Edit</button>
                                                                </div>
                                                                {form.employees.map((emp, i) => (
                                                                    <div key={i} className="mb-8 shadow-inner space-y-4">
                                                                        <h5 className="text-xl font-semibold text-gray-900 mb-3">Employee #{i + 1}</h5>
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
                                                                            {emp.id && <p><strong>ID:</strong> {emp.id}</p>}
                                                                            {emp.name && <p><strong>Name:</strong> {emp.name}</p>}
                                                                            {emp.age && <p><strong>Age:</strong> {emp.age}</p>}
                                                                            {emp.gender && <p><strong>Gender:</strong> {emp.gender}</p>}
                                                                            {emp.email && <p><strong>Email:</strong> {emp.email}</p>}
                                                                            {emp.phone && <p><strong>Phone:</strong> {emp.phone}</p>}
                                                                            {(form.collection_mode === "at_home" || form.collection_mode === "At-Home" || form.collection_mode?.[0] === "at_home") && emp.home_address && (
                                                                                <p className="md:col-span-2"><strong>Address:</strong> {emp.home_address}</p>
                                                                            )}
                                                                            {emp.conditions?.length > 0 && (
                                                                                <p className="md:col-span-2"><strong>Conditions:</strong> {emp.conditions.map(cond => cond === "Other" && emp.other_condition ? `Other: ${emp.other_condition}` : cond).join(", ")}</p>
                                                                            )}
                                                                        </div>
                                                                        {emp.has_dependents && emp.dependents?.length > 0 && (
                                                                            <div className="mt-4 space-y-4">
                                                                                <h6 className="text-lg font-bold text-blue-700">Dependents</h6>
                                                                                {emp.dependents.map((dep, j) => (
                                                                                    <div key={j} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                                                        <h6 className="font-semibold mb-2 text-lg">Dependent #{j + 1}</h6>
                                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-base">
                                                                                            {dep.name && <p><strong>Name:</strong> {dep.name}</p>}
                                                                                            {dep.age && <p><strong>Age:</strong> {dep.age}</p>}
                                                                                            {dep.gender && <p><strong>Gender:</strong> {dep.gender}</p>}
                                                                                            {dep.phone && <p><strong>Phone:</strong> {dep.phone}</p>}
                                                                                            {dep.email && <p><strong>Email:</strong> {dep.email}</p>}
                                                                                            {dep.conditions?.length > 0 && (
                                                                                                <p className="md:col-span-2"><strong>Conditions:</strong> {dep.conditions.map(cond => cond === "Other" && dep.other_condition ? `Other: ${dep.other_condition}` : cond).join(", ")}</p>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </section>
                                                        </div>
                                                        <div className="mt-10 flex justify-end all_btn">
                                                            <button onClick={() => { setIsVerified(true); setIsCaptchaEnabled(true); setTimeout(() => { setShowReviewModal(false); }, 1000); }} className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-300 ${isVerified ? "bg-green-600 hover:bg-green-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>Yes, All Data Correct</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {step === -1 && submissionSuccess && (
                                        <ThankYouPage companyData={companyData} form={form} bookingRef={bookingRef} handlePrintModal={handlePrintModal} settings={settings} />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Footer CTA */}
                {!isDashboard && step > 0 && step < steps.length - 1 && step !== 1 && step !== steps.length - 2 && (
                    <div className="footer_cta z-40 bg-white border-t p-4 flex justify-center shadow-inner">
                        <button onClick={handleBack} className="bg-gray-200 hover:bg-gray-300 mx-5 text-gray-700 px-6 py-3 rounded-md text-lg font-semibold">← Back</button>
                        {authenticated && (
                            <button onClick={() => {
                                if (step === 2 && form.office_location.trim() === "") { alert("Please select an office location before proceeding."); flashHighlight(["office_location"]); return; }
                                if (step === 2 && !form.collection_mode?.[0]) { alert("Please select a preferred collection type."); flashHighlight(["collection_mode"]); return; }
                                if (step === 3 && !form.employees.every(isEmployeeComplete)) { alert("Please complete all required employee fields."); return; }
                                handleNext();
                            }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-lg font-semibold">Next →</button>
                        )}
                    </div>
                )}

                {/* Popup Modals */}
                {popupVisible && (
                    <div className="fixed mobil_pa inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                        <div className="bg-white rounded-xl th_popup shadow-xl p-10 text-center max-w-md w-full animate-fadeIn">
                            {popupType === "success" ? (
                                <div>
                                    <div className="text-green-600 text-xl mb-2 animate-bounce">
                                        <div className="swal2-icon-1 swal2-success smoth_faild swal2-animate-success-icon" style={{ display: "flex" }}>
                                            <div className="swal2-success-circular-line-left smoth_faild_1"></div><span className="swal2-success-line-tip"></span><span className="swal2-success-line-long"></span><div className="swal2-success-ring"></div><div className="swal2-success-fix"></div><div className="swal2-success-circular-line-right"></div>
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-bold text-green-700 mb-2">Success</h2>
                                    <p className="text-gray-700">Your booking has been submitted successfully!</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="text-red-600 text-2xl mb-4 animate-shake">
                                        <div className="swal2-icon-1 swal2-error swal2-animate-error-icon" style={{ display: "flex" }}>
                                            <span className="swal2-x-mark"><span className="swal2-x-mark-line-left"></span><span className="swal2-x-mark-line-right"></span></span>
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-bold text-red-700 mb-2">Oops!</h2>
                                    <p className="text-gray-700">We couldn't process your booking. Please try again or contact support.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Sticky Footer */}
                <Footer companyName={settings.company_name} />
            </div>
        </>
    );
};

ChatFormHealthProject.layout = null;
export default ChatFormHealthProject;
