// resources/js/Pages/Offices/Index.jsx

import { Head, router } from "@inertiajs/react";
import PageBreadcrumb from "@/Components/common/PageBreadCrumb";
import ComponentCard from "@/Components/common/ComponentCard";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import "datatables.net-dt/css/dataTables.dataTables.css";
import toast from "react-hot-toast";
import ActionMenu from "@/Components/ui/Action";
import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // ✅ Added
import { faSearch } from "@fortawesome/free-solid-svg-icons"; // ✅ Added

DataTable.use(DT);

export default function CompanyOffices({ title = "Company Office" }) {
    const tableRef = useRef(null); // ✅ Keep ref for custom search
    const [searchTerm, setSearchTerm] = useState(""); // ✅ Search state
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedOffice, setSelectedOffice] = useState(null);

    const columns = [
        { data: "id", title: "Sys Id", orderable: false, searchable: false },
        { data: "office_name", title: "Office" },
        { data: "company_name", title: "Company" },
        { data: "allowed_collection_mode", title: "Allowed Collection Mode" },
        {
            data: "status",
            title: "Status",
            render: (data, type, row) => {
                const checked = data === "active" ? "checked" : "";
                return `
      <label class="switch">
        <input
          type="checkbox"
          class="office-status-toggle"
          data-id="${row.id}"
          data-current="${data}"
          ${checked}>
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

    // ✅ Custom Search Handler
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (tableRef.current) {
            tableRef.current.dt().search(value).draw();
        }
    };

    // ✅ exactly one delegated listener with cleanup, confirm + revert on error
    useEffect(() => {
        const tableEl = document.querySelector(".display");
        if (!tableEl) return;

        const tokenEl = document.querySelector('meta[name="csrf-token"]');
        const csrf = tokenEl?.getAttribute("content") || "";
        const pending = new Set();

        const onChange = async (e) => {
            const t = e.target;
            if (
                !(
                    t &&
                    t.classList &&
                    t.classList.contains("office-status-toggle")
                )
            )
                return;

            console.log("Toggle clicked!", t);

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

                const url = route("companyOffice.toggle-status", {
                    companyOffice: id,
                });
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
                });

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();

                if (data?.success) {
                    const isActive = data.status === "active";
                    t.checked = isActive;
                    t.dataset.current = data.status;

                    // ✅ reload the whole table via DataTables API (vanilla)
                    if (tableEl.DataTable) {
                        tableEl.DataTable().ajax.reload(null, false);
                    }

                    toast.success(`Status updated to ${data.status}`);
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

        // delegate at document level so toggle works even after redraw
        document.addEventListener("change", onChange);
        return () => {
            document.removeEventListener("change", onChange);
        };
    }, []);

    return (
        <div>
            <Head title={`${title} List`} />
            <PageBreadcrumb pageTitle={`${title} List`} />
            <ComponentCard

                url={route("companyOffice.create")}
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
                        ref={tableRef} // ✅ Attach ref
                        ajax={route("companyOffice.list")}
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
                                        setSelectedOffice(rowData);   // store data
                                        setViewModalOpen(true);       // open modal
                                    }}
                                    onEdit={() =>
                                        router.visit(route("companyOffice.edit", rowData.id))
                                    }
                                />
                            ),
                        }}
                    />
                </div>
            </ComponentCard>

            {/* Minimal switch CSS (same as Companies) */}
            <style>{`
        .switch{position:relative;display:inline-block;width:40px;height:20px}
        .switch input{opacity:0;width:0;height:0}
        .slider{position:absolute;cursor:pointer;background:#ccc;transition:.4s;border-radius:20px;inset:0}
        .slider:before{position:absolute;content:"";height:14px;width:14px;left:3px;bottom:3px;background:#fff;transition:.4s;border-radius:50%}
        input:checked + .slider{background:#4caf50}
        input:checked + .slider:before{transform:translateX(20px)}
      `}</style>
            {viewModalOpen && selectedOffice && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-8 relative">

                        {/* Close Button */}
                        <button
                            onClick={() => setViewModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
                        >
                            ✕
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-14 w-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-normal">
                                {selectedOffice.office_name?.charAt(0).toUpperCase()}
                            </div>

                            <div>
                                <h2 className="text-xl font-normal text-gray-900">
                                    Office Details
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {selectedOffice.company_name}
                                </p>
                            </div>
                        </div>

                        <div className="border-t mb-6"></div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-y-5 text-sm">

                            <div>
                                <p className="text-gray-500 font-medium">Office Name</p>
                                <p className="font-normal">{selectedOffice.office_name}</p>
                            </div>

                            <div>
                                <p className="text-gray-500 font-medium">Company</p>
                                <p className="font-normal">{selectedOffice.company_name}</p>
                            </div>

                            <div>
                                <p className="text-gray-500 font-medium">Allowed Collection</p>
                                <p className="font-normal">{selectedOffice.allowed_collection_mode}</p>
                            </div>

                            <div>
                                <p className="text-gray-500 font-medium">Status</p>
                                <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${selectedOffice.status === "active"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                    }`}>
                                    {selectedOffice.status}
                                </span>
                            </div>
<div>
  <p className="text-gray-500 font-medium">Address Line 1</p>
  <p className="font-normal">{selectedOffice.address_line_1 || "-"}</p>
</div>

<div>
  <p className="text-gray-500 font-medium">Address Line 2</p>
  <p className="font-normal">{selectedOffice.address_line_2 || "-"}</p>
</div>

<div>
  <p className="text-gray-500 font-medium">City</p>
  <p className="font-normal">{selectedOffice.city || "-"}</p>
</div>

<div>
  <p className="text-gray-500 font-medium">State</p>
  <p className="font-normal">{selectedOffice.state || "-"}</p>
</div>

<div>
  <p className="text-gray-500 font-medium">Country</p>
  <p className="font-normal">{selectedOffice.country || "-"}</p>
</div>

<div>
  <p className="text-gray-500 font-medium">Pincode</p>
  <p className="font-normal">{selectedOffice.pincode || "-"}</p>
</div>

                        </div>

                        <div className="border-t mt-6"></div>
                    </div>
                </div>
            )}

        </div>
    );
}