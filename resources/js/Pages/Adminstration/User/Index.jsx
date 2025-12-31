import React, { useState, useRef, useEffect } from 'react';
import DataTable from 'datatables.net-react';
import DT from 'datatables.net-dt';
import PageBreadcrumb from "@/Components/common/PageBreadCrumb";
import ComponentCard from "@/Components/common/ComponentCard";
import ActionMenu from '@/Components/ui/Action';
import { router, Head } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // ✅ Added
import { faSearch } from "@fortawesome/free-solid-svg-icons"; // ✅ Added

DataTable.use(DT);

function User({ title }) {
    const tableRef = useRef(null); // ✅ Keep ref for custom search
    const [searchTerm, setSearchTerm] = useState(""); // ✅ Search state
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        toast.success('User list loaded successfully!');
    }, []);

    // ✅ Custom Search Handler
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (tableRef.current) {
            tableRef.current.dt().search(value).draw();
        }
    };

    const columns = [
        { data: 'DT_RowIndex', title: 'S.No', orderable: false, searchable: false },
        { data: 'name', title: 'Name' },
        { data: 'email', title: 'Email' },
        {
            data: 'action', name: "action", title: 'Action', orderable: false, searchable: false
        }
    ];

    return (
        <div>
            <Head title={`${title} List`} />
            <PageBreadcrumb pageTitle={title + 's List'} />
            <ComponentCard url={route('user.create')} urlText={'Create ' + title} icon={null}>

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
                        ajax={route('user.list')}
                        columns={columns}
                        className="display nowrap w-100"
                        options={{
                            responsive: true,
                            select: true,
                            serverSide: true,
                            processing: true,
                            searching: true, // ✅ Ensure searching is enabled for API
                            order: [[1, 'asc']],
                            // ✅ CHANGED: 'l' left (entries), 'r' processing, 't' table, 'i' info, 'p' pagination
                            dom: 'lrt<"flex items-center justify-between px-4 py-3 border-t"ip>',
                        }}
                        slots={{
                            action: (cellData, rowData) => (
                                <ActionMenu
                                    onView={() => {
                                        setSelectedUser(rowData);
                                        setViewModalOpen(true);
                                    }}
                                    onEdit={() => router.visit(route('user.edit', rowData.id))}
                                />
                            ),
                        }}

                    />
                </div>
            </ComponentCard>
            {viewModalOpen && selectedUser && (
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
                    {selectedUser.name?.charAt(0).toUpperCase()}
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        User Details
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {selectedUser.email}
                    </p>
                </div>
            </div>

            <div className="border-t mb-6"></div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-y-5 text-sm">

                <div>
                    <p className="text-gray-500 font-medium">Full Name</p>
                    <p className="font-semibold">{selectedUser.name || "-"}</p>
                </div>

                <div>
                    <p className="text-gray-500 font-medium">Email</p>
                    <p className="font-semibold">{selectedUser.email || "-"}</p>
                </div>

            </div>

            <div className="border-t mt-6"></div>
        </div>
    </div>
)}

        </div>
    );
}

export default User;