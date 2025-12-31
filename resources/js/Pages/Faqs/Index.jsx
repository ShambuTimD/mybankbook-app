import React, { useEffect, useRef, useState } from "react";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import PageBreadcrumb from "@/Components/common/PageBreadCrumb";
import ComponentCard from "@/Components/common/ComponentCard";
import ActionMenu from "@/Components/ui/Action";
import { router, Head, usePage } from "@inertiajs/react";
import toast from "react-hot-toast";
import CategoryCreateForm from "./CategoryCreateForm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // ✅ Added
import { faSearch } from "@fortawesome/free-solid-svg-icons"; // ✅ Added

DataTable.use(DT);

export default function Faqs({ title = "FAQ" }) {
    const tableRef = useRef(null); // ✅ Keep ref
    const { flash } = usePage();
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [viewData, setViewData] = useState(null);
    
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
        { data: "id", title: "ID" },
        { data: "question", title: "Question" },
        { data: "category_name", title: "Category" },
        {
            data: "is_active",
            title: "Status",
            render: (data, type, row) => {
                const checked = data === 1 ? "checked" : "";
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

    // STATUS TOGGLE HANDLER
    useEffect(() => {
        const csrf = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content");

        const pending = new Set();

        const onToggle = async (e) => {
            const el = e.target;
            if (!el.classList.contains("status-toggle")) return;

            const id = el.dataset.id;
            if (!id || pending.has(id)) return;

            const next = el.checked ? 1 : 0;
            const current = parseInt(el.dataset.current);

            if (!window.confirm("Change status?")) {
                el.checked = current ? true : false;
                return;
            }

            try {
                pending.add(id);
                el.disabled = true;

                const url = route("support.faq.toggle", { id });

                const res = await fetch(url, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": csrf,
                        Accept: "application/json",
                    },
                    body: JSON.stringify({ is_active: next }),
                });

                const data = await res.json();
                if (data.success) {
                    el.dataset.current = next;
                    toast.success("Status updated");

                    const tableEl = document.querySelector(".display");
                    if (tableEl?.DataTable) {
                        tableEl.DataTable().ajax.reload(null, false);
                    }
                } else {
                    el.checked = current;
                    toast.error("Failed to update");
                }
            } catch (err) {
                el.checked = current;
                toast.error("Error updating");
            } finally {
                pending.delete(id);
                el.disabled = false;
            }
        };

        document.addEventListener("change", onToggle);
        return () => document.removeEventListener("change", onToggle);
    }, []);

    return (
        <div>
            <Head title="FAQ List" />
            <PageBreadcrumb pageTitle="FAQ List" />

            <ComponentCard
                url={route("support.faq.create")}
                urlText="Create FAQ"
                actions={
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        className="text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-full"
                    >
                        + Create Category
                    </button>
                }
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
                        ajax={route("support.faq.list")}
                        columns={columns}
                        className="display nowrap w-100"
                        options={{
                            scrollX: true,
                            processing: true,
                            serverSide: true,
                            searching: true, // ✅ Ensure searching enabled for API
                            pageLength: 50,
                            order: [[0, "desc"]],
                            // ✅ CHANGED: 'l' left (entries), 'r' processing, 't' table, 'i' info, 'p' pagination
                            dom: 'lrt<"flex items-center justify-between px-4 py-3 border-t"ip>',
                        }}
                        slots={{
                            action: (cellData, rowData) => (
                                <ActionMenu
                                    onView={() => setViewData(rowData)}
                                    onEdit={() =>
                                        router.visit(
                                            route("support.faq.edit", rowData.id)
                                        )
                                    }
                                    // onDelete={() => {
                                    //     const url = route("support.faq.delete", rowData.id);

                                    //     fetch(url, {
                                    //         method: "DELETE",
                                    //         headers: {
                                    //             "X-CSRF-TOKEN": document
                                    //                 .querySelector('meta[name="csrf-token"]')
                                    //                 .getAttribute("content"),
                                    //             "Accept": "application/json",
                                    //         },
                                    //     })
                                    //         .then(async (res) => {
                                    //             const result = await res.json();

                                    //             if (res.ok && result.success) {
                                    //                 toast.success(result.message);
                                    //                 const tableEl = document.querySelector(".display");
                                    //                 if (tableEl?.DataTable) {
                                    //                     tableEl.DataTable().ajax.reload(null, false);
                                    //                 }
                                    //             } else {
                                    //                 toast.error(result.message || "Delete failed");
                                    //             }
                                    //         })
                                    //         .catch(() => toast.error("Server error while deleting"));
                                    // }}
                                />
                            ),
                        }}
                    />
                </div>
            </ComponentCard>

            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
                        <button
                            className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
                            onClick={() => setShowCategoryModal(false)}
                        >
                            ✕
                        </button>

                        <h2 className="text-lg font-semibold mb-4">Create FAQ Category</h2>

                        <CategoryCreateForm
                            onClose={() => setShowCategoryModal(false)}
                        />
                    </div>
                </div>
            )}

            {viewData && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
                        <button
                            className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
                            onClick={() => setViewData(null)}
                        >
                            ✕
                        </button>

                        <h2 className="text-lg font-semibold mb-3">FAQ Details</h2>

                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-medium">Category</p>
                                <p className="text-gray-700">{viewData.category_name}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium">Question</p>
                                <p className="text-gray-700">{viewData.question}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium">Answer</p>
                                <p className="text-gray-700 whitespace-pre-line">
                                    {viewData.answer}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-medium">Sort Order</p>
                                <p className="text-gray-700">{viewData.sort_order}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium">Status</p>
                                <span
                                    className={`px-2 py-1 rounded text-white ${viewData.is_active ? "bg-green-600" : "bg-red-600"
                                        }`}
                                >
                                    {viewData.is_active ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>

                        <div className="mt-5 text-right">
                            <button
                                onClick={() => setViewData(null)}
                                className="px-4 py-2 bg-blue-600 text-white rounded"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ Hidden Category Form used by modal logic above if needed separately */}
            <CategoryCreateForm
                show={false} // Controlled by the modal above
                onClose={() => {}}
                onSuccess={() => {
                    const tableEl = document.querySelector(".display");
                    if (tableEl?.DataTable) {
                        tableEl.DataTable().ajax.reload(null, false);
                    }
                }}
            />

            <style>{`
        .switch { position: relative; display: inline-block; width: 40px; height: 20px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; background: #ccc; transition: .4s; border-radius: 20px; inset: 0; }
        .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background: #fff; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background: #4caf50; }
        input:checked + .slider:before { transform: translateX(20px); }
      `}</style>
        </div>
    );
}