import React, { useRef, useState } from "react";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import { Head } from "@inertiajs/react";
import PageBreadcrumb from "@/Components/common/PageBreadCrumb";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // ✅ Added
import { faSearch } from "@fortawesome/free-solid-svg-icons"; // ✅ Added

DataTable.use(DT);

export default function ChatList({ title }) {
    const tableRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState(""); // ✅ Search State

    // ✅ Custom Search Handler
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (tableRef.current) {
            tableRef.current.dt().search(value).draw();
        }
    };

    const columns = [
        { data: "id", title: "ID" },
        { data: "ticket_no", title: "Ticket No" },
        { data: "sender", title: "Sender" },
        { data: "message", title: "Message" },
        { data: "created_on", title: "Created At" },
    ];

    return (
        <div className="p-6">
            <Head title={title} />

            {/* === Header === */}
            <PageBreadcrumb pageTitle="Support Chat Logs" />

            {/* --- White Card Wrapper --- */}
            <div className="bg-white rounded-2xl shadow p-6">
                
                {/* ✅ WRAPPED for Custom Search Positioning */}
                <div className="dt-wrapper-relative">
                    
                    {/* ✅ Custom Search Box */}
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

                    {/* --- Datatable --- */}
                    <div className="overflow-x-auto">
                        <DataTable
                            ref={tableRef}
                            ajax={route("support.chats.list")}
                            columns={columns}
                            className="display w-full"
                            options={{
                                responsive: false,
                                scrollX: true,
                                autoWidth: false,
                                serverSide: true,
                                processing: true,
                                searching: true, // ✅ Ensure searching is enabled
                                pageLength: 10,
                                lengthMenu: [10, 25, 50, 100],
                                // ✅ CHANGED: 'l' left (entries), 'r' processing, 't' table, 'i' info, 'p' pagination
                                dom: 'lrt<"flex items-center justify-between px-4 py-3 border-t"ip>',
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}