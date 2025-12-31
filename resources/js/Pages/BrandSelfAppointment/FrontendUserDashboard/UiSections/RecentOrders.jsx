import React, { useEffect, useRef, useState, useMemo } from "react";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import axios from "axios";
import moment from "moment";
import { router } from "@inertiajs/react";
import "datatables.net-dt/css/dataTables.dataTables.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSearch,
    faRotateRight,
    faSpinner,
    faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-hot-toast";

DataTable.use(DT);

const RecentApplicants = ({ officeId }) => {
    const userData = JSON.parse(sessionStorage.getItem("session_user") || "{}");
    const token = userData?.token;
    const tableRef = useRef(null);

    // --- STATES ---
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);

    // --- REFS ---
    const filtersRef = useRef({ officeId });

    useEffect(() => {
        filtersRef.current = { officeId };
    }, [officeId]);

    // --- HANDLERS ---
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (tableRef.current) {
            tableRef.current.dt().search(value).draw();
        }
    };

    const handleRefresh = () => {
        if (tableRef.current) {
            setLoading(true);
            tableRef.current.dt().ajax.reload(() => {
                setLoading(false);
                toast.success("Data refreshed");
            }, false);
        }
    };

    const handleExport = (type = "csv") => {
        try {
            setLoading(true);
            const dt = tableRef.current?.dt();
            if (!dt) return toast.error("Table not ready!");

            const tableData = dt.rows({ search: "applied" }).data().toArray();

            if (!tableData.length) {
                toast.error("No records to export.");
                setLoading(false);
                return;
            }

            const exportRows = tableData.map((row) => ({
                "Serial No": row.id,
                "UARN": row.uarn || "-",
                "BRN": row.brn || "-",
                "Name": row.full_name || "-",
                "Company": row.company_name || "-",
                "Office": row.office_name || "-",
                "Type": row.applicant_type ? row.applicant_type.charAt(0).toUpperCase() + row.applicant_type.slice(1) : "-",
                "Status": row.status || "-",
                "Report Status": row.report_status || "-",
            }));

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
            link.download = `recent_applicants_${moment().format("YYYY-MM-DD")}.${type}`;
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

    // --- COLUMNS ---
    const columns = useMemo(() => [
        {
            data: "id",
            title: "#(Serial No.)",
            className: "dt-center font-mono font-medium text-blue-600",
            render: (data) => `<span>${data}</span>`,
        },
        {
            data: "uarn",
            title: "UARN",
            className: "dt-center font-mono font-medium text-blue-600",
            render: (data) => `<span>${data}</span>`,
        },
        {
            data: "brn",
            title: "BRN",
            className: "dt-center font-mono font-medium text-blue-600",
            render: (data) => `<span>${data}</span>`,
        },
        { data: "full_name", title: "Name", className: "dt-center whitespace-nowrap" },
        { data: "company_name", title: "Company", className: "dt-center whitespace-nowrap" },
        { data: "office_name", title: "Office", className: "dt-center whitespace-nowrap" },
        {
            data: "applicant_type",
            title: "Type",
            className: "dt-center whitespace-nowrap",
            render: (data) =>
                data ? data.charAt(0).toUpperCase() + data.slice(1) : "",
        },
        {
            data: null,
            title: "Status",
            className: "dt-center",
            render: (row) => {
    const format = (v) =>
        v
            ? v
                  .split("_")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")
            : "";

    // 🎯 If status = cancelled → show ONLY cancelled
    if (row.status?.toLowerCase() === "cancelled") {
        return `
            <div class="flex items-center justify-center">
                <span class="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide bg-red-100 text-red-700">
                    ${format(row.status)}
                </span>
            </div>
        `;
    }

    // Normal Status Badge
    const statusMap = {
        active: "bg-blue-100 text-blue-700",
        scheduled: "bg-purple-100 text-purple-700",
        attended: "bg-green-100 text-green-700",
        cancelled: "bg-red-100 text-red-700",
        no_show: "bg-orange-100 text-orange-700",
    };
    const appStatusClass =
        statusMap[row.status?.toLowerCase()] ||
        "bg-gray-100 text-gray-700";

    // Report Status Badge
    const reportMap = {
        processing: "bg-yellow-50 text-yellow-600 border border-yellow-200",
        report_uploaded: "bg-indigo-50 text-indigo-600 border border-indigo-200",
        report_shared: "bg-teal-50 text-teal-600 border border-teal-200",
        in_qc: "bg-pink-50 text-pink-600 border border-pink-200",
    };
    const reportStatusClass =
        reportMap[row.report_status?.toLowerCase()] ||
        "bg-gray-50 text-gray-500 border border-gray-200";

    let html = `<div class="flex items-center justify-center gap-2 whitespace-nowrap">`;

    // show main status
    if (row.status) {
        html += `<span class="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${appStatusClass}">
            ${format(row.status)}
        </span>`;
    }

    // show report status only IF status is not cancelled
    if (row.report_status && row.status?.toLowerCase() !== "cancelled") {
        html += `<span class="text-gray-400 font-bold">-</span>`;
        html += `<span class="px-2 py-0.5 rounded text-[10px] font-medium ${reportStatusClass}">
            ${format(row.report_status)}
        </span>`;
    }

    html += `</div>`;
    return html;
},
        },
    ], []);

    // --- TABLE OPTIONS ---
    const tableOptions = useMemo(() => ({
        processing: true,
        serverSide: true,
        paging: false,
        lengthChange: false,
        info: false,
        searching: true,
        ordering: false,
        dom: 'rt',

        ajax: (data, callback) => {
            const currentOfficeId = filtersRef.current.officeId !== "all" ? filtersRef.current.officeId : null;
            const searchValue = data.search.value;

            const sessionOfficeId = sessionStorage.getItem("selected_office_id") || "all";
            const finalOfficeId = currentOfficeId || (sessionOfficeId !== "all" ? sessionOfficeId : null);

            axios
                .get(route("applicants.index"), {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                    params: {
                        page: 1,
                        per_page: 50,
                        office_id: finalOfficeId,
                        applicant_type: null,
                        filter: sessionStorage.getItem("selected_financial_year") || null,
                        search: searchValue,
                        _t: new Date().getTime()
                    },
                })
                .then((response) => {
                    if (response.data.status === "success") {
                        callback({
                            draw: data.draw,
                            recordsTotal: response.data.total ?? 0,
                            recordsFiltered: response.data.total ?? 0,
                            data: response.data.records ?? [],
                        });
                    } else {
                        callback({ draw: data.draw, data: [] });
                    }
                })
                .catch((error) => {
                    console.error("Error fetching applicants:", error);
                    callback({ draw: data.draw, data: [] });
                });
        },

        // ✅ HIGHLIGHT FULL ROW WHEN is_hold == true
        createdRow: function (row, data) {
            if (data.is_hold == 1 || data.is_hold === true) {
                row.style.setProperty("background-color", "#fee2e2", "important");
                row.classList.add("!bg-red-100");
            }
        },

    }), [token]);

    useEffect(() => {
        if (tableRef.current) {
            tableRef.current.dt().ajax.reload(null, false);
        }
    }, [officeId]);

    return (
        <div className="rounded-xl border border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden flex flex-col h-full">
            {/* HEADER */}
            <div className="flex items-center justify-between p-2 py-3 bg-blue-50 dark:bg-gray-700 border-b border-blue-200 dark:border-gray-700">
                <div className="bg-blue-600 rounded-r-full pl-4 pr-6 py-2 shadow-md">
                    <h3 className="text-lg font-semibold text-white">
                        Recent Applicants
                    </h3>
                </div>

                <button
                    onClick={() => {
                        sessionStorage.setItem("korpheal_is_dashboard", "true");
                        router.visit("/f/reports");
                    }}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors mr-2"
                >
                    See All →
                </button>
            </div>

            {/* CONTROLS */}
            <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-end gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 border rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 bg-white shadow-sm h-[38px]"
                    >
                        <FontAwesomeIcon
                            icon={loading ? faSpinner : faRotateRight}
                            spin={loading}
                            className="text-gray-600 text-lg"
                        />
                        <span>Refresh</span>
                    </button>

                    <div className="inline-flex items-center border rounded-md bg-white hover:bg-gray-50 cursor-pointer shadow-sm h-[38px]">
                        <FontAwesomeIcon
                            icon={faDownload}
                            className="text-gray-600 ml-3 mr-2 text-sm"
                        />
                        <select
                            defaultValue=""
                            onChange={(e) => {
                                if (e.target.value) handleExport(e.target.value);
                                e.target.value = "";
                            }}
                            className="bg-transparent border-none outline-none px-2 pr-[35px] py-2 text-sm cursor-pointer appearance-none font-medium text-gray-700 h-full"
                        >
                            <option value="">Export</option>
                            <option value="csv">CSV</option>
                            <option value="xlsx">Excel</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* SEARCH */}
            <div className="px-4 py-2 border-b border-gray-100 flex justify-end bg-gray-50/50">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-64 transition-shadow bg-white shadow-sm"
                    />
                </div>
            </div>

            {/* TABLE CONTAINER */}
            {/* Added custom class 'table-scroll-container' to target strictly */}
            <div className="p-0 relative table-scroll-container" style={{ maxHeight: "600px", overflowY: "auto" }}>
                <style>{`
  /* Align all header + body cells */
  .table-scroll-container table.dataTable tbody td,
  .table-scroll-container table.dataTable thead th {
    text-align: center !important;
    vertical-align: middle !important;
  }

  /* Unified header color */
  .table-scroll-container table.dataTable thead th,
  table.dataTable thead th,
  table.dataTable thead td {
    background-color: #f8fafc !important;
    color: #475569 !important; /* slate-600 */
    font-weight: 600 !important;
    white-space: nowrap;
  }

  /* Sticky Header */
  .table-scroll-container table.dataTable thead th {
    position: sticky !important;
    top: 0 !important;
    z-index: 10 !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }

  /* Reset DataTables margins */
  .table-scroll-container table.dataTable { 
      margin-top: 0 !important; 
      margin-bottom: 0 !important;
      width: 100% !important;
  }
`}</style>


                <div className="px-4 py-2 min-w-full">
                    <DataTable
                        ref={tableRef}
                        className="display nowrap w-full text-sm text-gray-800"
                        options={tableOptions}
                        columns={columns}
                    />
                </div>
            </div>
        </div>
    );
};

export default RecentApplicants;