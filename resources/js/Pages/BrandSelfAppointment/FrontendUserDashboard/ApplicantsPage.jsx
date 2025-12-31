import React, { useRef, useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import ComponentCard from "@/Components/common/ComponentCard";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import axios from "axios";
import ReactDOM from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUsers,
    faEllipsisV,
    faSearch,
} from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Header from "@/Pages/BrandSelfAppointment/Header";
import Footer from "@/Pages/BrandSelfAppointment/Footer";
import ApplicantDetailsModal from "./ApplicantDetailsModal";

DataTable.use(DT);

const ApplicantsPage = ({ booking_id, settings }) => {
    // User Data
    const userData = JSON.parse(sessionStorage.getItem("session_user") || "{}");
    const token = userData?.token;

    const [companyData, setCompanyData] = useState(null);
    const [applicantData, setApplicantData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [brn, setBrn] = useState(null);

    const tableRef = useRef(null);

    const [openModal, setOpenModal] = useState(false);
    const [selectedApplicant, setSelectedApplicant] = useState(null);

    // ----------------------------------------
    // Restore Header Company Data
    // ----------------------------------------
    useEffect(() => {
        const savedUser = sessionStorage.getItem("session_user");
        const savedCompany = sessionStorage.getItem("session_company");
        const selectedOfficeName = sessionStorage.getItem(
            "korpheal_selected_office_name"
        );

        if (savedUser && savedCompany) {
            try {
                const parsedUser = JSON.parse(savedUser);
                const parsedCompany = JSON.parse(savedCompany);

                const constructedData = {
                    company_name: parsedCompany.company_name,
                    logo: parsedCompany.logo || "",
                    offices: parsedCompany.offices || [],
                    display_center:
                        selectedOfficeName ||
                        parsedCompany.offices?.[0]?.office_name ||
                        "",
                    hr_details: {
                        name: parsedUser.first_name || "HR Team",
                        email: parsedUser.email,
                        profile_image: "",
                        empid: `${parsedUser.id}`,
                        designation: parsedUser.role_title || "HR Admin",
                        role_name: parsedUser.role_name,
                    },
                };
                setCompanyData(constructedData);
            } catch (e) {
                console.error("Error parsing session data for header:", e);
            }
        }
    }, []);

    // ----------------------------------------
    // Fetch Booking + Applicants
    // ----------------------------------------
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const bookingRes = await axios.get(
                    `/api/bookings/${booking_id}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                if (bookingRes.data.success) {
                    setBrn(bookingRes.data.data.brn);
                }

                const applicantsRes = await axios.get(
                    `/api/bookings/${booking_id}/applicants`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                const list =
                    applicantsRes.data?.data ||
                    applicantsRes.data?.records ||
                    [];
                setApplicantData(list);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        if (booking_id && token) fetchData();
    }, [booking_id, token]);

    // Search handler
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (tableRef.current) {
            tableRef.current.dt().search(value).draw();
        }
    };

    // ----------------------------------------
    // Action Icons (unchanged)
    // ----------------------------------------
    const ActionIcons = ({ row }) => {
        const [open, setOpen] = useState(false);
        const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
        const buttonRef = useRef(null);
        const dropdownRef = useRef(null);

        const billUrl = row?.bill_url;
        const reportUrl = row?.report_url;
        const isCancelled = row?.status === "cancelled";

        useEffect(() => {
            const handleClickOutside = (e) => {
                if (
                    dropdownRef.current &&
                    !dropdownRef.current.contains(e.target) &&
                    !buttonRef.current?.contains(e.target)
                ) {
                    setOpen(false);
                }
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, []);

        useEffect(() => {
            if (!open || !buttonRef.current) return;
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPos({
                top: rect.bottom + 4,
                left: rect.right - 192,
            });
        }, [open]);

        return (
            <div className="relative flex items-center justify-center">
                <button
                    ref={buttonRef}
                    onClick={() => setOpen(!open)}
                    className="p-2 text-gray-600 hover:text-gray-800 rounded hover:bg-gray-100"
                >
                    <FontAwesomeIcon icon={faEllipsisV} />
                </button>

                {open &&
                    ReactDOM.createPortal(
                        <div
                            ref={dropdownRef}
                            className="fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999]"
                            style={{
                                top: `${menuPos.top}px`,
                                left: `${menuPos.left}px`,
                            }}
                        >
                            {/* VIEW → Always Enabled */}
                            <button
                                onClick={() => {
                                    setSelectedApplicant(row);
                                    setOpenModal(true);
                                    setOpen(false);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            >
                                View
                            </button>

                            {/* ===================================================
                            CANCELLED → HIDE ALL DOWNLOAD OPTIONS
                           =================================================== */}
                            {isCancelled ? null : (
                                <>
                                    {/* HOLD LOGIC — Disable All Downloads */}
                                    {row.is_hold == 1 ? (
                                        <>
                                            <button
                                                disabled
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                                            >
                                                Download Bill
                                            </button>

                                            <button
                                                disabled
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                                            >
                                                Download Report
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {/* DOWNLOAD BILL */}
                                            <button
                                                disabled={!billUrl}
                                                onClick={() => billUrl && window.open(billUrl, "_blank")}
                                                className={`block w-full text-left px-4 py-2 text-sm ${billUrl
                                                    ? "hover:bg-gray-100 text-gray-700"
                                                    : "text-gray-400 cursor-not-allowed bg-gray-50"
                                                    }`}
                                            >
                                                Download Bill
                                            </button>

                                            {/* DOWNLOAD REPORT */}
                                            <button
                                                disabled={!reportUrl}
                                                onClick={() => reportUrl && window.open(reportUrl, "_blank")}
                                                className={`block w-full text-left px-4 py-2 text-sm ${reportUrl
                                                    ? "hover:bg-gray-100 text-gray-700"
                                                    : "text-gray-400 cursor-not-allowed bg-gray-50"
                                                    }`}
                                            >
                                                Download Report
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>,
                        document.body
                    )}
            </div>
        );
    };

    // ----------------------------------------
    // DataTable Columns
    // ----------------------------------------
    const applicantColumns = [
        { data: "uarn", title: "UARN" },
        { data: "brn", title: "BRN" },
        { data: "full_name", title: "Name" },
        {
            title: "Company",
            data: "company_name",
            render: (data) => data || "-",
        },
        {
            title: "Office",
            data: "office_name",
            render: (data) => data || "-",
        },
        { data: "applicant_type", title: "Type" },

        {
            data: "status",
            title: "Status",
            render: (status, t, row) => {
                const reportStatus = row.report_status || null;

                // Capitalizer
                const cap = (str) => {
                    if (!str) return "N/A";
                    return String(str)
                        .replace(/_/g, " ")
                        .trim()
                        .toLowerCase()
                        .replace(/^./, (m) => m.toUpperCase());
                };

                const statusText = status ? cap(status) : null;
                const reportText = reportStatus ? cap(reportStatus) : null;

                // Colors
                const appMap = {
                    attended: "bg-green-100 text-green-700 border border-green-300",
                    scheduled: "bg-blue-100 text-blue-700 border border-blue-300",
                    pending: "bg-yellow-100 text-yellow-700 border border-yellow-300",
                    cancelled: "bg-red-100 text-red-700 border border-red-300",
                    not_started: "bg-gray-100 text-gray-700 border border-gray-300",
                };

                const repMap = {
                    processing: "bg-yellow-50 text-yellow-600 border border-yellow-200",
                    report_uploaded: "bg-indigo-50 text-indigo-600 border border-indigo-200",
                    report_shared: "bg-teal-50 text-teal-600 border border-teal-200",
                    in_qc: "bg-pink-50 text-pink-600 border border-pink-200",
                };

                const appCls =
                    appMap[status] || "bg-gray-100 text-gray-700 border border-gray-300";
                const repCls =
                    repMap[reportStatus] ||
                    "bg-gray-100 text-gray-700 border border-gray-300";

                const remark = row.status_remarks
                    ? row.status_remarks.replace(/"/g, "&quot;")
                    : "";

                // 🚨 RULE 1 → CANCELLED: Only main status
                if (status?.toLowerCase() === "cancelled") {
                    return `
            <span class="px-3 py-[4px] rounded-full text-xs font-medium ${appCls}">
                ${statusText}
            </span>
        `;
                }

                // 🚨 RULE 2 → ATTENDED: Show BOTH
                if (status?.toLowerCase() === "attended") {
                    return `
            <div class="inline-flex items-center gap-2 whitespace-nowrap">
                <span class="px-3 py-[4px] rounded-full text-xs font-medium ${appCls}">
                    ${statusText}
                </span>

                <span class="text-gray-400 font-bold">–</span>

                <span class="px-3 py-[4px] rounded-full text-xs font-medium ${repCls}">
                    ${reportText}
                </span>
            </div>
        `;
                }

                // 🚨 RULE 3 → ALL OTHER STATUSES: Only main status
                return `
        <span class="px-3 py-[4px] rounded-full text-xs font-medium ${appCls}">
            ${statusText}
        </span>
    `;
            },
        },

        {
            data: null,
            title: "Action",
            orderable: false,
            searchable: false,
            name: "action",
        },
    ];

    const applicantTableOptions = {
        data: applicantData,
        columns: applicantColumns,
        searching: true,
        pageLength: 10,
        ordering: true,
        dom: 'lrt<"flex items-center justify-between px-4 py-3 border-t"ip>',

        // ✅ HIGHLIGHT FULL ROW WHEN is_hold == true
        createdRow: function (row, data) {
            if (data.is_hold == 1 || data.is_hold === true) {
                row.style.setProperty("background-color", "#fee2e2", "important");
                row.style.setProperty("color", "#302f2fff", "important");
                row.classList.add("!bg-red-100");
            }
        },
    };

    useEffect(() => {
        // Always restore the normal page scroll
        document.body.style.overflow = "auto";

        // Override DataTables auto-scroll lock
        const style = document.createElement("style");
        style.innerHTML = `
        .dataTables_scrollBody {
            overflow-y: auto !important;
        }
        html, body {
            overflow-y: auto !important;
        }
    `;
        document.head.appendChild(style);

        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative">
            <Head title="Applicant Details" />

            {loading && (
                <div className="fixed inset-0 bg-white bg-opacity-70 flex items-center justify-center z-[9999]">
                    <div className="loader"></div>
                </div>
            )}

            <Header
                authenticated={true}
                settings={settings}
                companyData={companyData}
                currentStep={0}
                steps={[]}
                isDashboardView={false}
            />

            <main className="flex-1 p-6">
                <ComponentCard>
                    <div className="mb-4 border-b pb-3">
                        <h2 className="text-xl font-normal text-gray-800 flex items-center gap-2">
                            <FontAwesomeIcon
                                icon={faUsers}
                                className="text-blue-600"
                            />
                            Applicant Details
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            List of applicants associated with Booking Ref:{" "}
                            <strong>{brn || ""}</strong>
                        </p>
                    </div>

                    {!loading && (
                        <div className="mt-4 dt-wrapper-relative">
                            {/* 🔥 CENTER ALIGN ALL HEADERS & CELLS */}
                            <style>{`
                                table.dataTable thead th {
                                    text-align: center !important;
                                    vertical-align: middle !important;
                                }
                                table.dataTable tbody td {
                                    text-align: center !important;
                                }
                            `}</style>

                            <div className="dt-custom-search-box mb-3">
                                <div className="relative">
                                    <FontAwesomeIcon
                                        icon={faSearch}
                                        className="absolute left-3 top-2.5 text-gray-400"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                                    />
                                </div>
                            </div>

                            <DataTable
                                ref={tableRef}
                                className="display nowrap w-full font-normal text-gray-800"
                                options={applicantTableOptions}
                                slots={{
                                    action: (cellData, row) => (
                                        <ActionIcons row={row} />
                                    ),
                                }}
                            />
                        </div>
                    )}

                    <ToastContainer position="bottom-right" autoClose={2500} />
                </ComponentCard>

                <ApplicantDetailsModal
                    open={openModal}
                    onClose={() => setOpenModal(false)}
                    applicant={selectedApplicant}
                />
            </main>

            <Footer
                companyName={settings?.company_name || "Corporate Wellness"}
            />
        </div>
    );
};

ApplicantsPage.layout = null;
export default ApplicantsPage;
