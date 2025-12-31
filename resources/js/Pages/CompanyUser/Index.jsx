// resources/js/Pages/CompanyUser/Index.jsx
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import PageBreadcrumb from "@/Components/common/PageBreadCrumb";
import ComponentCard from "@/Components/common/ComponentCard";
import ActionMenu from "@/Components/ui/Action";
import { Head, router } from "@inertiajs/react";
import toast from "react-hot-toast";
import { useEffect, useRef, useState } from "react";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // ✅ Added
import { faSearch } from "@fortawesome/free-solid-svg-icons"; // ✅ Added

DataTable.use(DT);

function CompanyUsers({ title = "Company User" }) {
    const tableRef = useRef(null); // ✅ keep DataTable ref
    const [searchTerm, setSearchTerm] = useState(""); // ✅ Search state
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const columns = [
        { data: "id", title: "Sys Id", orderable: false, searchable: false },
        { data: "name", title: "Name" },
        { data: "email", title: "Email" },
        { data: "phone", title: "Phone" },
        { data: "role", title: "Role" }, // ✅ flat string now
        { data: "company", title: "Company" }, // ✅ flat string now
        { data: "office", title: "Office" },
        {
            data: "last_login",
            title: "Last Login",
            render: (data) => {
                return data ? moment(data).format("DD-MM-YYYY HH:mm") : "-";
            },
        },
        {
            data: "status",
            title: "Status",
            render: (data, type, row) => {
                const checked = data === "active" ? "checked" : "";
                return `
          <label class="switch">
            <input type="checkbox" class="user-status-toggle" data-id="${row.id}" data-current="${data}" ${checked}>
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

    // ✅ Single delegated listener with confirm, lock, revert & cleanup
    useEffect(() => {
        const tableEl = document.querySelector(".display");
        if (!tableEl) return;

        const tokenEl = document.querySelector('meta[name="csrf-token"]');
        const csrf = tokenEl?.getAttribute("content") || "";
        const pending = new Set();

        const onChange = async (e) => {
            const t = e.target;
            if (!(t && t.classList?.contains("user-status-toggle"))) return;

            const id = t.dataset.id;
            if (!id || pending.has(id)) return;

            const willBeActive = t.checked;
            const next = willBeActive ? "active" : "inactive";
            const current =
                t.dataset.current || (willBeActive ? "inactive" : "active");

            const ok = window.confirm(`Set this user to "${next}"?`);
            if (!ok) {
                t.checked = current === "active";
                return;
            }

            try {
                pending.add(id);
                t.disabled = true;

                // ✅ FIX: pass param as object
                const res = await fetch(
                    route("companyUser.toggle-status", { companyUser: id }),
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRF-TOKEN": csrf,
                            "X-Requested-With": "XMLHttpRequest",
                            Accept: "application/json",
                        },
                        credentials: "include",
                    }
                );

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();

                if (data?.success) {
                    const isActive = data.status === "active";
                    t.checked = isActive;
                    t.dataset.current = data.status;
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

        document.addEventListener("change", onChange); // ✅ delegate to document
        return () => document.removeEventListener("change", onChange);
    }, []);

    // ✅ reload helper
    const reloadTable = () => {
        if (tableRef.current) {
            const dt = tableRef.current.dt(); // datatables.net-react exposes .dt()
            dt.ajax.reload(null, false);
        }
    };

    // ================= USER VIEW MODAL ==================
    const UserViewModal = ({ show, onClose, data }) => {
        if (!show || !data) return null;

        return (
            <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50">
                <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 relative animate-fadeIn">

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                    >
                        ✕
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-4 border-b pb-4 mb-4">
                        <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-normal">
                            {data.name?.charAt(0) ?? "U"}
                        </div>
                        <div>
                            <h2 className="text-xl font-normal text-gray-900">User Details</h2>
                            <p className="text-sm text-gray-500">{data.email}</p>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">

                        <div>
                            <p className="text-gray-500">Full Name</p>
                            <p className="font-medium text-gray-800">{data.name}</p>
                        </div>

                        <div>
                            <p className="text-gray-500">Phone</p>
                            <p className="font-medium text-gray-800">{data.phone || "-"}</p>
                        </div>

                        <div>
                            <p className="text-gray-500">Role</p>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-normal">
                                {data.role || "-"}
                            </span>
                        </div>

                        <div>
                            <p className="text-gray-500">Company</p>
                            <p className="font-medium text-gray-800">{data.company || "-"}</p>
                        </div>

                        <div className="md:col-span-2">
                            <p className="text-gray-500">Office</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {(data.office ?? "-")
                                    .toString()
                                    .split(",")
                                    .map((o, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
                                        >
                                            {o.trim()}
                                        </span>
                                    ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-gray-500">Status</p>
                            <span
                                className={`px-2 py-1 rounded-md text-xs font-normal ${data.status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                    }`}
                            >
                                {data.status}
                            </span>
                        </div>

                        <div>
                            <p className="text-gray-500">Last Login</p>
                            <p className="font-medium text-gray-800">
                                {data.last_login || "-"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            <Head title={`${title} List`} />
            <PageBreadcrumb pageTitle={`${title} List`} />
            <ComponentCard
                url={route("companyUser.create")}
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
                        ajax={route("companyUser.list")}
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
                                        setSelectedUser(rowData);
                                        setViewModalOpen(true);
                                    }}
                                    onEdit={() =>
                                        router.visit(route("companyUser.edit", rowData.id))
                                    }
                                />

                            )
                        }}
                    />
                </div>
            </ComponentCard>

            {/* same switch CSS you use elsewhere */}
            <style>
                {`
                    .switch{position:relative;display:inline-block;width:40px;height:20px}
                    .switch input{opacity:0;width:0;height:0}
                    .slider{position:absolute;cursor:pointer;background:#ccc;transition:.4s;border-radius:20px;inset:0}
                    .slider:before{position:absolute;content:"";height:14px;width:14px;left:3px;bottom:3px;background:#fff;transition:.4s;border-radius:50%}
                    input:checked + .slider{background:#4caf50}
                    input:checked + .slider:before{transform:translateX(20px)}
                `}
            </style>

            <UserViewModal
                show={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                data={selectedUser}
            />
        </div>
    );
}

export default CompanyUsers;
