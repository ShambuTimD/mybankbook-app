import React, { useRef, useState, useEffect } from "react";
import ComponentCard from "@/Components/common/ComponentCard";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import axios from "axios";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSpinner,
    faRotate,
    faDownload,
    faEllipsisV,
    faSearch
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import ReactDOM from "react-dom";
import ViewReportModal from "@/Pages/BrandSelfAppointment/FrontendUserDashboard/ReportModals/ViewReportModal";
import RemarksModal from "@/Pages/BrandSelfAppointment/FrontendUserDashboard/ReportModals/RemarksModal";
import UploadReportModal from "@/Pages/BrandSelfAppointment/FrontendUserDashboard/ReportModals/UploadReportModal";
import Select from "react-select";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

DataTable.use(DT);

const ReportsList = () => {
    const userData = JSON.parse(sessionStorage.getItem("session_user") || "{}");
    const token = userData?.token;
    const tableRef = useRef(null);

    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isTableLoading, setIsTableLoading] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [viewData, setViewData] = useState(null);
    const [status, setStatus] = useState("attended");

    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [remarksModalOpen, setRemarksModalOpen] = useState(false);
    const [remarksText, setRemarksText] = useState("");
    const statusOptions = ["attended", "scheduled", "pending", "cancelled"];

    const [officeId, setOfficeId] = useState(
        sessionStorage.getItem("selected_office_id") || "all"
    );

    const filtersRef = useRef({ status, startDate, endDate, officeId });

    
    // ✅ Listen for Financial Year Change
    useEffect(() => {
        const handleFYChange = () => {
            const fy = sessionStorage.getItem("selected_financial_year");
            if (fy && fy.includes("-")) {
                const [startYear, endYear] = fy.split("-");
                setStartDate(`${startYear}-04-01`);
                setEndDate(`${endYear}-03-31`);
            } else {
                setStartDate("");
                setEndDate("");
            }
            if (tableRef.current) tableRef.current.dt().ajax.reload(null, false);
        };

        window.addEventListener("financial_year_changed", handleFYChange);
        handleFYChange();

        return () => {
            window.removeEventListener("financial_year_changed", handleFYChange);
        };
    }, []);

    

    // ✅ Listen for Office Change
    useEffect(() => {
        const handleOfficeChange = () => {
            const id = sessionStorage.getItem("selected_office_id") || "all";
            filtersRef.current.officeId = id;
            setOfficeId(id);

            window.dispatchEvent(new Event("office_change_start"));

            if (tableRef.current) {
                setIsTableLoading(true); // Start loader
                tableRef.current
                    .dt()
                    .ajax.reload(() => {
                        setIsTableLoading(false); // Stop loader
                        window.dispatchEvent(new Event("office_change_done"));
                    }, false);
            } else {
                window.dispatchEvent(new Event("office_change_done"));
            }
        };

        window.addEventListener("office_changed", handleOfficeChange);
        return () =>
            window.removeEventListener("office_changed", handleOfficeChange);
    }, []);

    useEffect(() => {
        filtersRef.current = { status, startDate, endDate, officeId };
    }, [status, startDate, endDate, officeId]);

    useEffect(() => {
        if (tableRef.current) {
            tableRef.current.dt().ajax.reload(null, false);
        }
    }, [status, startDate, endDate, officeId]);

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (tableRef.current) {
            tableRef.current.dt().search(value).draw();
        }
    };

    // --- SUB-COMPONENT: ACTION ICONS ---
    const ActionIcons = ({ row, onView }) => {
        const [open, setOpen] = useState(false);
        const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
        const buttonRef = useRef(null);
        const dropdownRef = useRef(null);

        // Media URLs
        const reportUrl = row?.report_media?.url;
        const billUrl = row?.bill_media?.url;

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
            const updatePosition = () => {
                const rect = buttonRef.current.getBoundingClientRect();
                setMenuPos({ top: rect.bottom + 4, left: rect.right - 192 });
            };
            updatePosition();
            window.addEventListener("scroll", updatePosition, true);
            window.addEventListener("resize", updatePosition);
            return () => {
                window.removeEventListener("scroll", updatePosition, true);
                window.removeEventListener("resize", updatePosition);
            };
        }, [open]);

        const isCancelled = row?.status === "cancelled";

        return (
            <div className="relative flex items-center justify-center">
                <button
                    ref={buttonRef}
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpen((s) => !s);
                    }}
                    className="p-2 text-gray-600 hover:text-gray-800 rounded hover:bg-gray-100 transition-colors"
                >
                    <FontAwesomeIcon icon={faEllipsisV} />
                </button>

                {open &&
                    ReactDOM.createPortal(
                        <div
                            ref={dropdownRef}
                            className="fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999]"
                            style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }}
                        >
                            {/* VIEW OPTION (ALWAYS ENABLED) */}
                            <button
                                onClick={() => {
                                    if (typeof onView === "function") onView(row);
                                    setOpen(false);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b"
                            >
                                View
                            </button>

                            {/* ============================================================
                             HIDE DOWNLOADS IF STATUS IS CANCELLED
                           ============================================================ */}
                            {!isCancelled && (
                                <>
                                    {/* DOWNLOAD REPORT */}
                                    {row.is_hold == 1 ? (
                                        <button
                                            disabled
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-300 cursor-not-allowed bg-gray-50"
                                        >
                                            Download Report
                                        </button>
                                    ) : reportUrl ? (
                                        <a
                                            href={reportUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                                            onClick={() => setOpen(false)}
                                        >
                                            Download Report
                                        </a>
                                    ) : (
                                        <button
                                            disabled
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-300 cursor-not-allowed bg-gray-50"
                                        >
                                            Download Report
                                        </button>
                                    )}

                                    {/* DOWNLOAD BILL */}
                                    {row.is_hold == 1 ? (
                                        <button
                                            disabled
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-300 cursor-not-allowed bg-gray-50"
                                        >
                                            Download Bill
                                        </button>
                                    ) : billUrl ? (
                                        <a
                                            href={billUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                                            onClick={() => setOpen(false)}
                                        >
                                            Download Bill
                                        </a>
                                    ) : (
                                        <button
                                            disabled
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-300 cursor-not-allowed bg-gray-50"
                                        >
                                            Download Bill
                                        </button>
                                    )}
                                </>
                            )}
                        </div>,
                        document.body
                    )}
            </div>
        );
    };


    const columns = [
        { data: "uarn", title: "UARN" },
        { data: "brn", title: "BRN" },
        {
            data: "company_name",
            title: "Company",
        },
        {
            data: "office_name",
            title: "Office",
        },
        {
            data: "applicant_type",
            title: "Type",
            render: (v) => (v === "employee" ? "Employee" : "Dependent"),
        },
        {
            data: "full_name",
            title: "Name",
            render: (v, t, r) => `${v || "-"} (${r.phone || "-"})`,
        },
        {
            data: "status",
            title: "Status",
            render: (v, t, row) => {
                const status = v || null;
                const reportStatus = row.report_status || null;

                // Format helper
                const cap = (str) => {
                    if (!str) return "N/A";
                    return String(str)
                        .replace(/_/g, " ")
                        .trim()
                        .toLowerCase()
                        .replace(/^./, (m) => m.toUpperCase());
                };

                const statusText = cap(status);
                const reportText = cap(reportStatus);

                const map = {
                    attended: "bg-green-100 text-green-700 border border-green-300",
                    scheduled: "bg-blue-100 text-blue-700 border border-blue-300",
                    pending: "bg-yellow-100 text-yellow-700 border border-yellow-300",
                    cancelled: "bg-red-100 text-red-700 border border-red-300",
                    not_started: "bg-gray-100 text-gray-700 border border-gray-300",
                };

                const cls = map[status] || "bg-gray-100 text-gray-700 border border-gray-300";

                // 💥 RULE #1 → CANCELLED → ONLY status
                if (status?.toLowerCase() === "cancelled") {
                    return `
                <span class="px-3 py-[4px] rounded-full text-xs font-medium ${cls}">
                    ${statusText}
                </span>
            `;
                }

                // 💥 RULE #2 → ONLY WHEN ATTENDED → SHOW BOTH
                if (status?.toLowerCase() === "attended") {
                    return `
                <span class="px-3 py-[4px] rounded-full text-xs font-medium ${cls}">
                    ${statusText} – ${reportText}
                </span>
            `;
                }

                // 💥 RULE #3 → ALL OTHERS → SHOW ONLY STATUS
                return `
            <span class="px-3 py-[4px] rounded-full text-xs font-medium ${cls}">
                ${statusText}
            </span>
        `;
            }
        },

        {
            data: "report_uploaded_on",
            title: "Report Updated On",
            render: (v) => {
                return v && v !== "N/A"
                    ? moment(v).format("DD-MM-YYYY HH:mm")
                    : "N/A";
            },
        },
        {
            data: null, // ✅ FIXED: Ensure data is null so we access whole row
            title: "Action",
            className: "dt-center text-center", // ✅ Center align the dots
            orderable: false,
            searchable: false,
            width: "50px",
            // ✅ FIXED: Using createdCell to reliably mount the React component
            createdCell: (td, cellData, rowData) => {
                ReactDOM.render(
                    <ActionIcons
                        row={rowData}
                        onView={(r) => {
                            setViewData(r);
                            setViewOpen(true);
                        }}
                    />,
                    td
                );
            },
        },
    ];

    const tableOptions = {
        processing: false,
        serverSide: true,
        scrollX: true,
        scrollCollapse: true,
        autoWidth: false,
        fixedHeader: true,
        dom: 'lrt<"flex items-center justify-between px-4 py-3 border-t"ip>',

        ajax: function (data, callback) {
            setIsTableLoading(true);

            const { status, startDate, endDate, officeId } = filtersRef.current;

            const currentPage = Math.floor(data.start / data.length) + 1;

            const params = {
                page: currentPage,
                per_page: data.length,
                draw: data.draw,
                search: data.search?.value || "",
                status: status !== "all" ? status : null,
                office_id: officeId !== "all" ? officeId : null,
                filter: sessionStorage.getItem("selected_financial_year") || null,
            };

            axios
                .get("/api/reports/list", {
                    headers: { Authorization: `Bearer ${token}` },
                    params,
                })
                .then((res) => {
                    if (res.data.success) {
                        callback({
                            draw: data.draw,
                            recordsTotal: res.data.total,
                            recordsFiltered: res.data.total,
                            data: res.data.data,
                        });
                    } else {
                        callback({ data: [], recordsTotal: 0, recordsFiltered: 0 });
                    }
                })
                .catch(() => {
                    callback({ data: [], recordsTotal: 0, recordsFiltered: 0 });
                })
                .finally(() => {
                    setIsTableLoading(false);
                });
        },

        // ✅ Add Highlight for Hold Rows
        createdRow: function (row, data) {
            if (data.is_hold == 1 || data.is_hold === true) {
                row.style.setProperty("background-color", "#fee2e2", "important");
                row.style.setProperty("color", "#302f2fff", "important");
                row.classList.add("!bg-red-100");
            }
        },

        columns,
        pageLength: 10,
        responsive: false,
        searching: true,
        ordering: true,
    };
    

    const handleRefresh = () => {
        if (tableRef.current) {
            tableRef.current.dt().ajax.reload(null, false);
        }
    };

    const handleExport = (type) => {
        try {
            if (!tableRef.current) {
                toast.error("Table not ready");
                return;
            }

            // 🔹 Get currently displayed (filtered) rows from DataTable
            const dt = tableRef.current.dt();
            const rowsData = dt
                .rows({ search: "applied" })
                .data()
                .toArray();

            if (!rowsData.length) {
                toast.error("No data available to export");
                return;
            }

            // 🔹 Transform data (similar to your Manual Sales export)
            const exportData = rowsData.map((r) => ({
                UARN: r.uarn || "-",
                BRN: r.brn || "-",
                Company: r.booking?.company || "-",
                Office: r.booking?.office || "-",
                Type:
                    r.applicant_type === "employee"
                        ? "Employee"
                        : r.applicant_type === "dependent"
                            ? "Dependent"
                            : "-",
                Name: `${r.full_name || "-"} (${r.phone || "-"})`,
                Status: r.status
                    ? r.status.replace(/_/g, " ").toUpperCase()
                    : "-",
                "Report Status": r.report_status
                    ? r.report_status.replace(/_/g, " ").toUpperCase()
                    : "-",
                "Report Updated On": r.report_uploaded_on
                    ? moment(r.report_uploaded_on).format("DD-MM-YYYY HH:mm")
                    : "N/A",
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Applicant Reports");

            const fileName = `Applicant_Reports_${new Date()
                .toISOString()
                .split("T")[0]}.${type}`;

            if (type === "csv") {
                const csvData = XLSX.utils.sheet_to_csv(worksheet);
                const blob = new Blob([csvData], {
                    type: "text/csv;charset=utf-8;",
                });
                saveAs(blob, fileName);
            } else if (type === "xlsx") {
                const excelBuffer = XLSX.write(workbook, {
                    bookType: "xlsx",
                    type: "array",
                });
                const blob = new Blob([excelBuffer], {
                    type:
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                });
                saveAs(blob, fileName);
            }

            toast.success(`Exported ${type.toUpperCase()} successfully`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to export data");
        }
    };



    return (
        <div className="space-y-8">
            <ComponentCard>
                <div className="mb-6 border-b pb-3 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-normal text-gray-800">Applicant Reports</h2>
                        <p className="text-sm text-gray-500 mt-1">View and manage uploaded health check reports. Use filters for quick insights.</p>
                    </div>
                </div>

                <div className="flex flex-wrap justify-between items-end gap-6 border-b border-gray-200 pb-3 mb-6">
                    <div className="flex flex-wrap gap-6 items-end">
                        <div className="flex flex-col min-w-[200px] relative z-[10]">
                            <label className="text-sm font-normal text-gray-800 mb-1">Filter by Status</label>
                            <Select
                                isDisabled={true}   // ✅ Select disabled
                                value={[{ label: "All", value: "all" }, ...statusOptions.map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))].find((opt) => opt.value === status)}
                                onChange={(opt) => setStatus(opt.value)}
                                options={[{ label: "All", value: "all" }, ...statusOptions.map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))]}
                                classNamePrefix="rselect"
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                styles={{
                                    control: (base) => ({ ...base, minHeight: "36px", borderColor: "#d1d5db", boxShadow: "none", "&:hover": { borderColor: "#0f75d1" }, zIndex: 9999 }),
                                    menuPortal: (base) => ({ ...base, zIndex: 999999 }),
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 items-center">
                        <button onClick={handleRefresh} className="flex items-center gap-2 border rounded px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                            {loading ? <FontAwesomeIcon icon={faSpinner} spin className="text-gray-600" /> : <FontAwesomeIcon icon={faRotate} className="text-gray-600" />}
                            <span>Refresh</span>
                        </button>
                        <div className="inline-flex items-center border rounded-md bg-white hover:bg-gray-50 cursor-pointer">
                            <FontAwesomeIcon icon={faDownload} className="text-gray-600 ml-3 mr-2 text-sm" />
                            <select
                                defaultValue=""
                                onChange={(e) => {
                                    const type = e.target.value;
                                    if (type) handleExport(type);
                                    e.target.value = "";
                                }}
                            >
                                <option value="">Export</option>
                                <option value="csv">CSV</option>
                                <option value="xlsx">Excel</option>
                            </select>
                        </div>
                    </div>
                </div>

                <hr className="border-t border-gray-200" />

                <div className="dt-wrapper-relative mt-4 overflow-visible relative z-[10] min-h-[200px]">
                    {isTableLoading && (
                        <div className="absolute inset-0 z-[50] flex items-center justify-center bg-white bg-opacity-70">
                            <div className="flex flex-col items-center">
                                <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-blue-600 mb-2" />
                                <span className="text-gray-600 font-medium">Loading data...</span>
                            </div>
                        </div>
                    )}
                    <div className="dt-custom-search-box">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                            </div>
                            <input type="text" placeholder="Search..." value={searchTerm} onChange={handleSearch} className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-64 transition-shadow bg-white" />
                        </div>
                    </div>

                    <DataTable
                        ref={tableRef}
                        className="display nowrap w-full font-normal text-gray-800"
                        options={tableOptions}
                    />
                </div>
            </ComponentCard>

            <ViewReportModal open={viewOpen} data={viewData} onClose={() => setViewOpen(false)} />
            <RemarksModal open={remarksModalOpen} remarksText={remarksText} onClose={() => setRemarksModalOpen(false)} />

            {viewData && (
                <UploadReportModal
                    open={uploadModalOpen}
                    row={viewData}
                    onClose={() => setUploadModalOpen(false)}
                    onUploadSuccess={() => tableRef.current?.dt()?.ajax.reload(null, false)}
                />
            )}
        </div>
    );
};

export default ReportsList;