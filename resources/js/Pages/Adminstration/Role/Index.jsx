import React, { useRef, useState } from "react";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import PageBreadcrumb from "@/Components/common/PageBreadCrumb";
import ComponentCard from "@/Components/common/ComponentCard";
import ActionMenu from "@/Components/ui/Action";
import { router, Head } from "@inertiajs/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // ✅ Added
import { faSearch } from "@fortawesome/free-solid-svg-icons"; // ✅ Added

DataTable.use(DT);

function Role({ title }) {
    const tableRef = useRef(null); // ✅ Keep ref for custom search
    const [searchTerm, setSearchTerm] = useState(""); // ✅ Search state
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);


    // ✅ Custom Search Handler
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (tableRef.current) {
            tableRef.current.dt().search(value).draw();
        }
    };

    const columns = [
        {
            data: "DT_RowIndex",
            title: "S.No",
            orderable: false,
            searchable: false,
        },
        { data: "role_title", title: "Name" },
        { data: "role_for", title: "Role For" },
        { data: "created_at", title: "Created At" },
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
            <Head title={`${title} List`} />
            <PageBreadcrumb pageTitle={title + "s List"} />
            <ComponentCard
                url={route("role.create")}
                urlText={"Create " + title}
                icon={null}
            >
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

                    <DataTable
                        ref={tableRef} // ✅ Attach ref
                        ajax={route("role.list")}
                        columns={columns}
                        className="display nowrap w-100"
                        options={{
                            responsive: true,
                            select: true,
                            serverSide: true,
                            processing: true,
                            searching: true, // ✅ Ensure searching is enabled for API
                            order: [[1, "desc"]],
                            // ✅ CHANGED: 'l' left (entries), 'r' processing, 't' table, 'i' info, 'p' pagination
                            dom: 'lrt<"flex items-center justify-between px-4 py-3 border-t"ip>',
                        }}
                        slots={{
                            action: (cellData, rowData) =>
                                rowData.role_name === "super_admin" ? (
                                    <></>
                                ) : (
                                    <ActionMenu
                                        onView={() => {
                                            setSelectedRole(rowData);
                                            setViewModalOpen(true);
                                        }}
                                        onEdit={() => router.visit(route("role.edit", rowData.id))}
                                    />
                                ),

                        }}
                    />
                </div>
            </ComponentCard>
            {viewModalOpen && selectedRole && (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-8 relative">

            {/* Close Button */}
            <button
                onClick={() => setViewModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
            >
                ✕
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-semibold">
                    {selectedRole.role_title?.charAt(0).toUpperCase()}
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        Role Details
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {selectedRole.role_title}
                    </p>
                </div>
            </div>

            <div className="border-t mb-6"></div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-y-5 text-sm">

                <div>
                    <p className="text-gray-500 font-medium">Role Name</p>
                    <p className="font-semibold">{selectedRole.role_title || "-"}</p>
                </div>

                <div>
                    <p className="text-gray-500 font-medium">Role For</p>
                    <p className="font-semibold">{selectedRole.role_for || "-"}</p>
                </div>

                <div>
                    <p className="text-gray-500 font-medium">Created At</p>
                    <p className="font-semibold">{selectedRole.created_at || "-"}</p>
                </div>

            </div>

            <div className="border-t mt-6"></div>

            {/* Footer */}
            <div className="mt-6 flex justify-end">
                <button
                    onClick={() => setViewModalOpen(false)}
                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium"
                >
                    Close
                </button>
            </div>

        </div>
    </div>
)}

        </div>
    );
}

export default Role;