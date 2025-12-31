import React, { useEffect, useRef, useState } from "react";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import PageBreadcrumb from "@/Components/common/PageBreadCrumb";
import ComponentCard from "@/Components/common/ComponentCard";
import ActionMenu from "@/Components/ui/Action";
import { router, Head, usePage } from "@inertiajs/react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // ✅ Added
import { faSearch } from "@fortawesome/free-solid-svg-icons"; // ✅ Added

DataTable.use(DT);

function Companies({ title = "Company" }) {
    const tableRef = useRef(null); // ✅ keep DataTable ref
    const { flash } = usePage(); // Get flash messages from Inertia
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);

    // ✅ Search State
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    // ✅ Custom Search Handler
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (tableRef.current) {
            tableRef.current.dt().search(value).draw();
        }
    };

    const columns = [
        { data: "id", title: "Sys Id", orderable: false, searchable: false },
        { data: "name", title: "Company" },
        { data: "short_name", title: "Short Name" },
        {
            data: "status",
            title: "Status",
            render: (data, type, row) => {
                const checked = data === "active" ? "checked" : "";
                return `
          <label class="switch">
            <input type="checkbox" class="status-toggle" data-id="${row.id}" data-current="${data}" ${checked}>
            <span class="slider round"></span>
          </label>
        `;
            },
            orderable: false,
            searchable: false,
        },
        {
            data: "action",
            name: "action",
            title: "Action",
            orderable: false,
            searchable: false,
        },
    ];

    // ✅ Add toggle handler (like Offices)
    useEffect(() => {
        const tokenEl = document.querySelector('meta[name="csrf-token"]');
        const csrf = tokenEl?.getAttribute("content") || "";
        const pending = new Set();

        const onChange = async (e) => {
            const t = e.target;
            if (!(t && t.classList && t.classList.contains("status-toggle")))
                return;

            const id = t.dataset.id;
            if (!id || pending.has(id)) return;

            const willBeActive = t.checked;
            const next = willBeActive ? "active" : "inactive";
            const current =
                t.dataset.current || (willBeActive ? "inactive" : "active");

            const ok = window.confirm(
                `Are you sure you want to set status to "${next}"?`
            );
            if (!ok) {
                t.checked = current === "active";
                return;
            }

            try {
                pending.add(id);
                t.disabled = true;

                const url = route("companies.toggle-status", { company: id });
                console.log("PATCH URL:", url);

                const res = await fetch(url, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": csrf,
                        "X-Requested-With": "XMLHttpRequest",
                        Accept: "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        _token: csrf,   // ✅ Laravel will accept this
                    }),
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();

                if (data?.success) {
                    t.checked = data.status === "active";
                    t.dataset.current = data.status;
                    toast.success(`Status updated to ${data.status}`);

                    // ✅ reload table data (no jQuery)
                    const tableEl = document.querySelector(".display");
                    if (tableEl?.DataTable) {
                        tableEl.DataTable().ajax.reload(null, false);
                    }
                } else {
                    t.checked = current === "active";
                    toast.error("Failed to update status.");
                }
            } catch (err) {
                t.checked = current === "active";
                toast.error("Error updating status.");
                console.error(err);
            } finally {
                pending.delete(id);
                t.disabled = false;
            }
        };

        document.addEventListener("change", onChange);
        return () => document.removeEventListener("change", onChange);
    }, []);

    // ✅ reload helper
    const reloadTable = () => {
        if (tableRef.current) {
            const dt = tableRef.current.dt(); // datatables.net-react exposes .dt()
            dt.ajax.reload(null, false);
        }
    };


    return (
        <div>
            <Head title={`${title} List`} />
            <PageBreadcrumb pageTitle={`${title} List`} />
            <ComponentCard
                url={route("companies.create")}
                urlText={`Create ${title}`}
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
                        ref={tableRef} // ✅ attach ref
                        ajax={route("companies.list")}
                        columns={columns}
                        className="display nowrap w-100"
                        options={{
                            responsive: false,
                            scrollX: true,
                            scrollY: "350px",
                            select: true,
                            serverSide: true,
                            processing: true,
                            searching: true, // ✅ Ensure searching is enabled for API
                            order: [[0, "desc"]],
                            pagination: true,
                            pageLength: 50,
                            lengthMenu: [10, 25, 50, 100],
                            // ✅ CHANGED: 'l' left (entries), 'r' processing, 't' table, 'i' info, 'p' pagination
                            dom: 'lrt<"flex items-center justify-between px-4 py-3 border-t"ip>',
                        }}
                        slots={{
                            action: (cellData, rowData) => (
                                <ActionMenu
                                    onView={() => {
                                        setSelectedCompany(rowData);
                                        setViewModalOpen(true);
                                    }}
                                    onEdit={() =>
                                        router.visit(route("companies.edit", rowData.id))
                                    }
                                />
                            ),
                        }}
                    />
                </div>
            </ComponentCard>

            <style>{`
        .switch { position: relative; display: inline-block; width: 40px; height: 20px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; background: #ccc; transition: .4s; border-radius: 20px; inset: 0; }
        .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background: #fff; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background: #4caf50; }
        input:checked + .slider:before { transform: translateX(20px); }
      `}</style>
            {viewModalOpen && selectedCompany && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-8 relative">

                        {/* Close Button */}
                        <button
                            onClick={() => setViewModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
                        >
                            ✕
                        </button>

                        {/* Header Section */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-14 w-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-normal">
                                {selectedCompany.name?.charAt(0).toUpperCase()}
                            </div>

                            <div>
                                <h2 className="text-xl font-normal text-gray-900">
                                    Company Details
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {selectedCompany.short_name}
                                </p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t mb-6"></div>

                        {/* Detail Grid */}
                        <div className="grid grid-cols-2 gap-y-5 text-sm">

                            {/* Company Name */}
                            <div>
                                <p className="text-gray-500 font-medium">Company Name</p>
                                <p className="font-normal text-gray-800">
                                    {selectedCompany.name}
                                </p>
                            </div>

                            {/* Status */}
                            <div>
                                <p className="text-gray-500 font-medium">Status</p>
                                <span
                                    className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${selectedCompany.status === "active"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                        }`}
                                >
                                    {selectedCompany.status}
                                </span>
                            </div>

                            {/* Website */}
                            <div>
                                <p className="text-gray-500 font-medium">Website</p>
                                <p className="font-normal text-gray-800">
                                    {selectedCompany.website ? (
                                        <a href={selectedCompany.website} target="_blank" className="text-blue-600 underline">
                                            {selectedCompany.website}
                                        </a>
                                    ) : (
                                        "-"
                                    )}
                                </p>
                            </div>

                            {/* Created At */}
                            <div>
                                <p className="text-gray-500 font-medium">Created At</p>
                                <p className="font-normal text-gray-800">
                                    {selectedCompany.created_at || "-"}
                                </p>
                            </div>

                            {/* GST */}
                            <div>
                                <p className="text-gray-500 font-medium">GST Number</p>
                                <p className="font-normal text-gray-800">
                                    {selectedCompany.gst_number || "-"}
                                </p>
                            </div>

                            {/* PAN */}
                            <div>
                                <p className="text-gray-500 font-medium">PAN Number</p>
                                <p className="font-normal text-gray-800">
                                    {selectedCompany.pan_number || "-"}
                                </p>
                            </div>

                            {/* Phone */}
                            <div>
                                <p className="text-gray-500 font-medium">Phone</p>
                                <p className="font-normal text-gray-800">
                                    {selectedCompany.phone || "-"}
                                </p>
                            </div>

                            {/* Alternate Phone */}
                            <div>
                                <p className="text-gray-500 font-medium">Alternate Phone</p>
                                <p className="font-normal text-gray-800">
                                    {selectedCompany.alternate_phone || "-"}
                                </p>
                            </div>

                        </div>

                        {/* Bottom Divider */}
                        <div className="border-t mt-6"></div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Companies;