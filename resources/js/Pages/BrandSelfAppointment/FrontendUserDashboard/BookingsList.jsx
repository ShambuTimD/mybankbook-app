import React, { useRef, useState, useEffect } from "react";
import ComponentCard from "@/Components/common/ComponentCard";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import axios from "axios";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSpinner,
    faRotate,
    faDownload,
    faEllipsisV,
    faSearch,
} from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import ReactDOM from "react-dom";
import { router } from "@inertiajs/react";
import ViewBookingModal from "@/Pages/BrandSelfAppointment/FrontendUserDashboard/BookingModals/ViewBookingModal";

DataTable.use(DT);

const BookingsList = () => {
    const userData = JSON.parse(sessionStorage.getItem("session_user") || "{}");
    const token = userData?.token;

    const tableRef = useRef(null);

    // ✅ State for Filters
    const [status, setStatus] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(false);

    // ✅ State for Search
    const [searchTerm, setSearchTerm] = useState("");

    // ✅ Modal States
    const [viewOpen, setViewOpen] = useState(false);
    const [viewData, setViewData] = useState(null);

    const statusOptions = ["pending", "confirmed", "cancelled", "completed"];

    // ✅ Financial Year Listener
    useEffect(() => {
        const handleFYChange = () => {
            const fy = sessionStorage.getItem("selected_financial_year");
            if (fy && fy.includes("-")) {
                const [startYear, endYear] = fy.split("-");
                setStartDate(`${startYear}-04-01`);
                setEndDate(`${endYear}-03-31`);
                if (tableRef.current)
                    tableRef.current.dt().ajax.reload(null, false);
            } else {
                setStartDate("");
                setEndDate("");
                if (tableRef.current)
                    tableRef.current.dt().ajax.reload(null, false);
            }
        };
        window.addEventListener("financial_year_changed", handleFYChange);
        handleFYChange();
        return () => {
            window.removeEventListener(
                "financial_year_changed",
                handleFYChange
            );
        };
    }, []);

    // ✅ Office Change Listener
    useEffect(() => {
        const handleOfficeChange = () => {
            window.dispatchEvent(new Event("office_change_start"));
            if (tableRef.current) {
                setLoading(true);
                tableRef.current.dt().ajax.reload(() => {
                    setLoading(false);
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

    // ✅ Handle View Applicants Logic
    const handleViewApplicants = (row) => {
        const url = `/f/bookings/${row.id}/applicants`;
        window.open(url, "_blank");
    };

    // ✅ Custom Search Handler
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (tableRef.current) {
            tableRef.current.dt().search(value).draw();
        }
    };

    // ==========================================
    // 1. BOOKING TABLE COLUMNS & OPTIONS
    // ==========================================
    const bookingColumns = [
        { data: "id", title: "SysID" },
        { data: "brn", title: "BRN" },
        { data: "company.name", title: "Company Name" },
        { data: "office.office_name", title: "Office Name" },
        {
            data: "total_applicants",
            title: "Total Applicants",
            render: (v) => v ?? 0,
        },
        {
            data: "pref_appointment_date",
            title: "Appointment Date",
            render: (data, type, row) => {
                const date = row.pref_appointment_date || row.appointment_date;
                return date ? moment(date).format("DD-MM-YYYY") : "-";
            },
        },
        {
            data: "booking_status",
            title: "Status / Remarks",
            render: (v, type, row) => {
                // Function to capitalize words and handle cases like "pending-hold", "no_show"
                const formatText = (text) => {
                    return text
                        .replace(/_/g, " ") // convert "no_show" → "no show"
                        .split(/[- ]/)      // split by hyphen or space
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // capitalize
                        .join(" ");         // join back with space
                };

                // HOLD CASE
                if (row.is_hold == 1) {
                    const formatted = `${formatText(v)} - Hold`;
                    return `<span class="px-2 py-1 rounded-full text-xs font-semibold bg-red-600 text-white">${formatted}</span>`;
                }

                // NORMAL STATUS COLORS
                const map = {
                    pending: "bg-yellow-100 text-yellow-700",
                    confirmed: "bg-blue-100 text-blue-700",
                    attended: "bg-green-100 text-green-700",
                    cancelled: "bg-red-100 text-red-700",
                    no_show: "bg-gray-100 text-gray-700",
                };

                const cls = map[v] || "bg-gray-100 text-gray-700";

                // Apply formatting
                const formatted = formatText(v);

                return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${cls}">${formatted}</span>`;
            },
        },

        {
            data: "created_by.name",
            title: "Created By",
            render: (v, type, row) => row.created_by.name || "—",
        },
        {
            data: "created_on",
            title: "Created On",
            render: (v) => (v ? moment(v).format("DD-MM-YYYY HH:mm") : "—"),
        },
        {
            data: "updated_on",
            title: "Updated On",
            render: (v) => (v ? moment(v).format("DD-MM-YYYY HH:mm") : "—"),
        },
        {
            data: "action",
            title: "Action",
            orderable: false,
            searchable: false,
            defaultContent: "",
            name: "action",
        },
    ];

    const filtersRef = useRef({ status, startDate, endDate });
    useEffect(() => {
        filtersRef.current = { status, startDate, endDate };
    }, [status, startDate, endDate]);

    useEffect(() => {
        if (tableRef.current) {
            tableRef.current.dt().ajax.reload(null, false);
        }
    }, [status, startDate, endDate]);

    const bookingTableOptions = {
        processing: true,
        serverSide: true,
        searching: true,
        scrollX: true,
        dom: '<"dt-topbar-row"l<"dt-right">>rt<"flex items-center justify-between px-4 py-3 border-t"ip>',
        ajax: function (data, callback) {
            const { status, startDate, endDate } = filtersRef.current;
            const params = {
                start: data.start,
                length: data.length,
                draw: data.draw,
                search: data.search?.value || "",
                booking_status: status !== "all" ? status : null,
                start_date: startDate || null,
                end_date: endDate || null,
                office_id:
                    sessionStorage.getItem("selected_office_id") !== "all"
                        ? sessionStorage.getItem("selected_office_id")
                        : null,
                filter:
                    sessionStorage.getItem("selected_financial_year") || null,
            };

            axios
                .get(route("frontbooking.index"), {
                    headers: { Authorization: `Bearer ${token}` },
                    params,
                })
                .then((res) => {
                    if (res.data.success) {
                        callback({
                            draw: data.draw,
                            recordsTotal: res.data.recordsTotal,
                            recordsFiltered: res.data.recordsFiltered,
                            data: res.data.data,
                        });
                    } else {
                        callback({ data: [] });
                    }
                })
                .catch(() => callback({ data: [] }));
        },
        columns: bookingColumns,
        pageLength: 10,
        lengthMenu: [10, 25, 50, 100],
        // ✅ FIXED SECTION: Using direct style property with 'important' to guarantee the red color
        createdRow: function (row, data, dataIndex) {
            if (data.is_hold == 1) {
                // We use setProperty with 'important' to override DataTables stripes
                // #fee2e2 is the hex code for Tailwind's red-100
                row.style.setProperty("background-color", "#fee2e2", "important");

                // We also add the class just in case
                row.classList.add("!bg-red-100");
            }
        },
    };

    const handleExport = async (type = "csv") => {
        try {
            setLoading(true);

            const dt = tableRef.current?.dt();
            if (!dt) return toast.error("Table not ready!");

            // Filtered + sorted rows (NOT paginated)
            const tableData = dt.rows({ search: "applied" }).data().toArray();

            if (!tableData.length) {
                toast.info("No records to export.");
                return;
            }

            // Build rows EXACTLY like DataTable columns
            const exportRows = tableData.map((row) => ({
                SysID: row.id,
                BRN: row.brn,
                "Company Name": row.company?.name || "-",
                "Office Name": row.office?.office_name || "-",
                "Total Applicants": row.total_applicants ?? 0,

                // Appointment Date
                "Appointment Date": moment(
                    row.pref_appointment_date || row.appointment_date
                ).isValid()
                    ? moment(
                        row.pref_appointment_date || row.appointment_date
                    ).format("DD-MM-YYYY")
                    : "-",

                // STATUS / REMARKS (remove badges)
                "Status / Remarks":
                    row.is_hold == 1
                        ? `${row.booking_status} - Hold`
                        : row.booking_status,

                "Created By": row.created_by?.name || "-",
                "Created On": row.created_on
                    ? moment(row.created_on).format("DD-MM-YYYY HH:mm")
                    : "-",
                "Updated On": row.updated_on
                    ? moment(row.updated_on).format("DD-MM-YYYY HH:mm")
                    : "-",
            }));

            // Create CSV
            const header = Object.keys(exportRows[0]).join(",");
            const rows = exportRows
                .map((row) =>
                    Object.values(row)
                        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                        .join(",")
                )
                .join("\n");

            const csvContent = header + "\n" + rows;

            const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;",
            });

            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `bookings_${new Date()
                .toISOString()
                .slice(0, 10)}.${type}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Export successful!");
        } catch (err) {
            console.error(err);
            toast.error("Export failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        if (tableRef.current) {
            setLoading(true);
            tableRef.current.dt().ajax.reload(() => setLoading(false), false);
        }
    };

    const exportBookingById = async (bookingId) => {
        try {
            setLoading(true);

            const res = await axios.get(
                route("frontbooking.export", bookingId),
                {
                    responseType: "blob",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log("export resp ", res);

            // Extract filename from header OR fallback
            const disposition = res.headers["content-disposition"];
            let fileName = "booking_export.xlsx";

            if (disposition && disposition.includes("filename=")) {
                fileName = disposition.split("filename=")[1].replace(/"/g, "");
            }

            const blob = new Blob([res.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Exported successfully");
        } catch (err) {
            console.error(err);
            toast.error("Export failed");
        } finally {
            setLoading(false);
        }
    };

    const ActionIcons = ({ row, onView, onViewApplicants, onExportSingle }) => {
        const [open, setOpen] = useState(false);
        const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
        const buttonRef = useRef(null);
        const dropdownRef = useRef(null);

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
            return () =>
                document.removeEventListener("mousedown", handleClickOutside);
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

        const hasBillOrCsv =
            Array.isArray(row.details) &&
            row.details.some((d) => d.bill_media_id);

        return (
            <div className="relative flex items-center justify-center">
                <button
                    ref={buttonRef}
                    onClick={() => setOpen((s) => !s)}
                    className="p-2 text-gray-600 hover:text-gray-800 rounded hover:bg-gray-100"
                    title="More Actions"
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
                            {/* View Details - ALWAYS ENABLED */}
                            <button
                                onClick={() => {
                                    onView(row.id);
                                    setOpen(false);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                View Details
                            </button>

                            {/* View Applicants - ALWAYS ENABLED */}
                            <button
                                onClick={() => {
                                    onViewApplicants(row);
                                    setOpen(false);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                View Applicants
                            </button>


                            {/* Download Bill - HIDDEN IF CANCELLED */}
                            {row.booking_status !== "cancelled" && (
                                <button
                                    disabled={row.is_hold == 1 || !hasBillOrCsv}
                                    onClick={() => {
                                        if (row.is_hold == 1 || !hasBillOrCsv) return;

                                        const billApplicant = row.details.find(
                                            (d) => d.bill_media_id && d.media?.length
                                        );

                                        let rawUrl =
                                            billApplicant?.media?.[0]?.original_url ||
                                            billApplicant?.bill_url ||
                                            "";

                                        if (!rawUrl) {
                                            toast.info("Bill not found.");
                                            return;
                                        }

                                        if (!/^https?:\/\//i.test(rawUrl)) {
                                            rawUrl = `${window.location.origin}/${rawUrl.replace(/^\//, "")}`;
                                        }

                                        window.open(rawUrl, "_blank", "noopener,noreferrer");
                                    }}
                                    className={`block w-full text-left px-4 py-2 text-sm ${row.is_hold == 1 || !hasBillOrCsv
                                            ? "text-gray-400 cursor-not-allowed"
                                            : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    Download Bill
                                </button>
                            )}

                            {/* Export Excel - DISABLED IF HOLD */}
                            <button
                                disabled={row.is_hold == 1}
                                onClick={() => {
                                    if (row.is_hold == 1) return;
                                    onExportSingle(row.id);
                                    setOpen(false);
                                }}
                                className={`block w-full text-left px-4 py-2 text-sm ${row.is_hold == 1
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-gray-700 hover:bg-gray-100"
                                    }`}
                            >
                                Export Excel
                            </button>
                        </div>,
                        document.body
                    )}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <ComponentCard>
                {/* Header Section */}
                <div className="mb-4 border-b pb-3 flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-normal text-gray-800 flex items-center gap-2">
                            Booking List
                        </h2>
                        <div className="mt-1">
                            <p className="text-sm text-gray-500">
                                View and manage your company’s wellness
                                bookings. Use filters for quick insights.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter / Action Row */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
                    <div className="flex flex-wrap gap-6 items-end">
                        <div className="flex flex-col w-[220px]">
                            <label className="text-sm font-normal text-gray-800 mb-1">
                                Filter by Status
                            </label>
                            <Select
                                classNamePrefix="rselect"
                                value={[
                                    { label: "All", value: "all" },
                                    ...statusOptions.map((s) => ({
                                        label:
                                            s.charAt(0).toUpperCase() +
                                            s.slice(1),
                                        value: s,
                                    })),
                                ].find((opt) => opt.value === status)}
                                onChange={(opt) => setStatus(opt.value)}
                                options={[
                                    { label: "All", value: "all" },
                                    ...statusOptions.map((s) => ({
                                        label:
                                            s.charAt(0).toUpperCase() +
                                            s.slice(1),
                                        value: s,
                                    })),
                                ]}
                                className="text-sm"
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        minHeight: "38px",
                                        height: "38px",
                                    }),
                                }}
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-normal text-gray-800 mb-1">
                                Filter by Date Range
                            </label>
                            <div className="flex items-center gap-2">
                                {/* Start Date */}
                                <DatePicker
                                    selected={
                                        startDate ? new Date(startDate) : null
                                    }
                                    onChange={(date) =>
                                        setStartDate(
                                            date
                                                ? moment(date).format(
                                                    "YYYY-MM-DD"
                                                )
                                                : ""
                                        )
                                    }
                                    dateFormat="dd-MM-yyyy"
                                    placeholderText="Start Date"
                                    className="h-[38px] w-[130px] rounded-md border border-gray-300 px-2 text-sm focus:border-blue-500 focus:outline-none"
                                />

                                <span className="text-gray-500">to</span>

                                {/* End Date */}
                                <DatePicker
                                    selected={
                                        endDate ? new Date(endDate) : null
                                    }
                                    onChange={(date) =>
                                        setEndDate(
                                            date
                                                ? moment(date).format(
                                                    "YYYY-MM-DD"
                                                )
                                                : ""
                                        )
                                    }
                                    dateFormat="dd-MM-yyyy"
                                    placeholderText="End Date"
                                    minDate={
                                        startDate ? new Date(startDate) : null
                                    }
                                    className="h-[38px] w-[130px] rounded-md border border-gray-300 px-2 text-sm focus:border-blue-500 focus:outline-none"
                                />

                                {/* Clear Button */}
                                {(startDate || endDate) && (
                                    <button
                                        onClick={() => {
                                            sessionStorage.setItem(
                                                "selected_financial_year",
                                                "lifetime"
                                            );
                                            window.dispatchEvent(
                                                new Event(
                                                    "financial_year_changed"
                                                )
                                            );
                                        }}
                                        className="px-3 py-[6px] text-sm rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 items-center">
                        <button
                            onClick={handleRefresh}
                            className="flex items-center gap-2 border rounded px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                        >
                            <FontAwesomeIcon
                                icon={loading ? faSpinner : faRotate}
                                spin={loading}
                                className="text-gray-600"
                            />
                            <span>Refresh</span>
                        </button>

                        <div className="inline-flex items-center border rounded-md bg-white hover:bg-gray-50 cursor-pointer">
                            <FontAwesomeIcon
                                icon={faDownload}
                                className="text-gray-600 ml-3 mr-2 text-sm"
                            />
                            <select
                                defaultValue=""
                                onChange={(e) => {
                                    if (e.target.value)
                                        handleExport(e.target.value);
                                    e.target.value = "";
                                }}
                                className="bg-transparent border-none outline-none px-2 pr-[35px] py-2 text-sm cursor-pointer appearance-none"
                            >
                                <option value="">Export</option>
                                <option value="csv">CSV</option>
                                <option value="xlsx">Excel</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ✅ Main Table Wrapper with Custom Search */}
                <div className="dt-wrapper-relative">
                    {/* Custom Search Box */}
                    <div className="dt-custom-search-box">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FontAwesomeIcon
                                    icon={faSearch}
                                    className="text-gray-400"
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-64 transition-shadow bg-white"
                            />
                        </div>
                    </div>

                    {/* DataTables Component */}

                    <DataTable
                        key="bookings-table"
                        ref={tableRef}
                        className="display nowrap w-full font-normal text-gray-800"
                        options={bookingTableOptions}
                        slots={{
                            action: (cellData, row) => (
                                <ActionIcons
                                    row={row}
                                    onView={(r) => {
                                        setViewData(r);
                                        setViewOpen(true);
                                    }}
                                    onViewApplicants={() =>
                                        handleViewApplicants(row)
                                    }
                                    onExportSingle={(id) =>
                                        exportBookingById(id)
                                    }
                                />
                            ),
                        }}
                    />
                </div>

                <ToastContainer position="bottom-right" autoClose={2500} />
            </ComponentCard>

            <ViewBookingModal
                open={viewOpen}
                data={viewData}
                onClose={() => setViewOpen(false)}
            />
        </div>
    );
};

export default BookingsList;