import React, { useEffect, useRef, useState } from "react";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import PageBreadcrumb from "@/Components/common/PageBreadCrumb";
import ComponentCard from "@/Components/common/ComponentCard";
import ActionMenu from "@/Components/ui/Action";
import { router, Head, usePage } from "@inertiajs/react";
import toast from "react-hot-toast";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSearch,
    faRotate,
    faSpinner,
    faDownload
} from "@fortawesome/free-solid-svg-icons";

// ✅ Client-side export libraries
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

DataTable.use(DT);

export default function TicketList({ title = "Support Tickets" }) {
    const tableRef = useRef(null);
    const { flash } = usePage();

    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

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
            tableRef.current.dt().ajax.reload(() => setLoading(false), false);
        }
    };

    // ✅ Client-Side Export Functionality
    const handleExport = async (type) => {
        try {
            setLoading(true);

            // 1. Fetch data from the existing list API
            // We pass 'length: -1' to ask the server for all records matching the search/filters
            // Adjust params based on what your backend 'support.tickets.list' accepts
            const res = await axios.get(route("support.tickets.list"), {
                params: {
                    search: { value: searchTerm || "" },
                    length: -1, // Request all records
                    start: 0
                }
            });

            const rawData = res.data.data || [];

            if (!rawData.length) {
                toast.error("No data available to export");
                setLoading(false);
                return;
            }

            // 2. Format data for Excel
            const exportData = rawData.map((t) => ({
                "Ticket ID": t.ticket_id,
                "Subject": t.subject,
                "User": t.user, // Assuming 'user' is a string/name in your API response
                "Priority": t.priority,
                "Category": t.category,
                "Status": t.status,
                "Created At": t.created_on,
                "Updated At": t.updated_on
            }));

            // 3. Generate File using XLSX
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");

            const fileName = `Support_Tickets_${new Date().toISOString().split("T")[0]}.${type}`;

            if (type === "csv") {
                const csvData = XLSX.utils.sheet_to_csv(worksheet);
                const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
                saveAs(blob, fileName);
            } else if (type === "xlsx") {
                const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
                const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                saveAs(blob, fileName);
            }

            toast.success(`Exported ${type.toUpperCase()} successfully`);

        } catch (error) {
            console.error(error);
            toast.error("Failed to export data");
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { data: "ticket_id", title: "Ticket ID" },
        { data: "subject", title: "Subject" },
        { data: "user", title: "User" },
        { data: "priority", title: "Priority" },
        { data: "category", title: "Category" },
        { data: "status", title: "Status" },
        { data: "created_on", title: "Created At" },
        { data: "updated_on", title: "Updated At" },
        {
            data: "action",
            name: "action",
            title: "Action",
            orderable: false,
            searchable: false,
        },
    ];

    return (
        <div>
            <Head title={`${title}`} />
            <PageBreadcrumb pageTitle={`${title}`} />

            <ComponentCard url={null} urlText="" icon={null}>
                <div className="flex justify-end items-center mb-4">
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-full flex items-center gap-2"
                        onClick={() => router.visit(route("support.tickets.create"))}
                    >
                        <span className="text-xl leading-none">+</span>
                        New Ticket
                    </button>
                </div>

                <div className="mb-5 flex flex-wrap justify-between items-end border-b pb-3 gap-4">
                    <div className="flex items-center gap-4">
                        {/* Placeholder for status filters */}
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                        <button
                            onClick={handleRefresh}
                            className="flex items-center gap-2 border rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 bg-white"
                        >
                            {loading ? (
                                <FontAwesomeIcon icon={faSpinner} spin className="text-gray-600 text-lg" />
                            ) : (
                                <FontAwesomeIcon icon={faRotate} className="text-gray-600 text-lg" />
                            )}
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
                                className="bg-transparent border-none outline-none px-2 pr-[35px] py-2 text-sm cursor-pointer appearance-none text-gray-700"
                            >
                                <option value="">Export</option>
                                <option value="csv">CSV</option>
                                <option value="xlsx">Excel</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="dt-wrapper-relative mt-4 overflow-visible relative z-[10]">
                    <div className="dt-custom-search-box">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
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

                    <DataTable
                        ref={tableRef}
                        ajax={route("support.tickets.list")}
                        columns={columns}
                        className="display nowrap w-100"
                        options={{
                            responsive: false,
                            scrollX: true,
                            scrollY: "400px",
                            serverSide: true,
                            processing: true,
                            searching: true,
                            order: [[6, "desc"]],
                            pageLength: 50,
                            lengthMenu: [10, 25, 50, 100],
                            dom: 'lrt<"flex items-center justify-between px-4 py-3 border-t"ip>',
                        }}
                        slots={{
                            action: (cellData, row) => (
                                <ActionMenu
                                    onEdit={() => router.visit(route("support.tickets.view", row.id))}
                                />
                            ),
                        }}
                    />
                </div>
            </ComponentCard>
        </div>
    );
}