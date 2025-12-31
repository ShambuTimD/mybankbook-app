import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import PageBreadcrumb from "@/Components/common/PageBreadCrumb";
import ComponentCard from "@/Components/common/ComponentCard";
import ActionMenu from "@/Components/ui/Action";
import { usePage, router, Head } from "@inertiajs/react";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // ✅ Added
import { faSearch } from "@fortawesome/free-solid-svg-icons"; // ✅ Added

DataTable.use(DT);

function Customers({ title = "Customer" }) {
    const flash = usePage().props.flash || {};

    // 🔹 NEW: local selection state + dt api
    const [selected, setSelected] = useState([]); // store selected row IDs
    const [api, setApi] = useState(null);
    
    // ✅ Search State
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (flash.success || flash.error) {
            Swal.fire({
                title: flash.success ? "Success!" : "Error!",
                text: flash.success || flash.error,
                icon: flash.success ? "success" : "error",
                confirmButtonText: "OK",
            });
        }
    }, [flash.success, flash.error]);

    // ✅ Custom Search Handler
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (api) {
            api.search(value).draw();
        }
    };

    const isSelected = (id) => selected.includes(id);
    const toggleOne = (id, tr) => {
        setSelected((prev) => {
            const next = prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id];
            if (tr) tr.classList.toggle("dt-row-selected", next.includes(id));
            return next;
        });
    };
    const toggleAllOnPage = () => {
        if (!api) return;
        const rows = api.rows().data().toArray();
        const ids = rows.map((r) => r.id);
        const allSelected = ids.every((id) => selected.includes(id));
        setSelected((prev) => {
            const next = allSelected
                ? prev.filter((id) => !ids.includes(id))
                : [...new Set([...prev, ...ids])];
            api.rows({ page: "current" }).every(function () {
                const d = this.data();
                const tr = this.node();
                const checked = next.includes(d.id);
                tr.classList.toggle("dt-row-selected", checked);
                const cb = tr.querySelector("input.row-check");
                if (cb) cb.checked = checked;
            });
            return next;
        });
    };
    const setAllOnPage = (checked) => {
        if (!api) return;

        const rows = api.rows({ page: "current" }).data().toArray();
        const ids = rows.map((r) => r.id);

        setSelected((prev) => {
            const next = checked
                ? [...new Set([...prev, ...ids])] // add all ids
                : prev.filter((id) => !ids.includes(id)); // remove all ids

            // update visuals for visible rows
            api.rows({ page: "current" }).every(function () {
                const d = this.data();
                const tr = this.node();
                const isOn = next.includes(d.id);
                tr.classList.toggle("dt-row-selected", isOn);
                const cb = tr.querySelector("input.row-check");
                if (cb) cb.checked = isOn;
            });

            return next;
        });
    };
    const columns = [
        // 🔹 NEW: checkbox column (first)
        {
            title: "",
            data: "id",
            orderable: false,
            searchable: false,
            width: "24px",
            render: (id) =>
                `<input class="row-check" type="checkbox" data-id="${id}" style="width:16px;height:16px;cursor:pointer" />`,
        },
        {
            data: "DT_RowIndex",
            title: "S.No",
            orderable: false,
            searchable: false,
        },
        { data: "first_name", title: "First Name" },
        { data: "last_name", title: "Last Name" },
        { data: "email_id", title: "Email" },
        { data: "phone_number", title: "Phone" },
        {
            data: "created_at",
            title: "Registered At",
            render: function (data) {
                return moment(data).format("DD-MM-YYYY hh:mm A");
            },
        },
        {
            data: "action",
            name: "action",
            title: "Action",
            orderable: false,
            searchable: false,
        },
    ];

    // delete confirmation (unchanged)
    const confirmDelete = (id, name = "") => {
        Swal.fire({
            title: "Are you sure?",
            text: `Delete customer ${name}? This action cannot be undone.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#e3342f",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route("customer.delete", id), {
                    onSuccess: () => {
                        Swal.fire({
                            title: "Deleted!",
                            text: "Customer has been deleted.",
                            icon: "success",
                        });
                    },
                    onError: () => {
                        Swal.fire({
                            title: "Error!",
                            text: "Something went wrong while deleting.",
                            icon: "error",
                        });
                    },
                    preserveScroll: true,
                });
            }
        });
    };

    return (
        <div>
            <Head title={`${title} List`} />
            <PageBreadcrumb pageTitle={`${title}s List`} />
            <ComponentCard
                url={route("customer.create")}
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
                        ajax={route("customer.list")}
                        columns={columns}
                        className="display"
                        options={{
                            responsive: true,
                            select: true, // kept as-is
                            serverSide: true,
                            processing: true,
                            searching: true, // ✅ Ensure searching is enabled for API
                            order: [[6, "desc"]],
                            pagination: true,
                            pageLength: 50,
                            lengthMenu: [10, 25, 50, 100],
                            // ✅ CHANGED: 'l' left (entries), 'r' processing, 't' table, 'i' info, 'p' pagination
                            dom: 'lrt<"flex items-center justify-between px-4 py-3 border-t"ip>',
                            initComplete: function () {
                                setApi(this.api());
                            },
                            headerCallback: function (thead) {
                                const th = thead.querySelector("th");
                                const tableApi = this.api(); // ✅ use DT API directly here
                                if (th && !th.dataset.init) {
                                    th.dataset.init = "1";
                                    th.innerHTML =
                                        '<input id="check-all" type="checkbox" style="width:16px;height:16px;cursor:pointer" />';
                                    th.querySelector("#check-all").addEventListener(
                                        "change",
                                        (e) => {
                                            const checked = e.target.checked;

                                            // update state using the rows on the CURRENT PAGE
                                            const rows = tableApi
                                                .rows({ page: "current" })
                                                .data()
                                                .toArray();
                                            const ids = rows.map((r) => r.id);

                                            setSelected((prev) => {
                                                const next = checked
                                                    ? [
                                                          ...new Set([
                                                              ...prev,
                                                              ...ids,
                                                          ]),
                                                      ]
                                                    : prev.filter(
                                                          (id) => !ids.includes(id)
                                                      );

                                                // update visuals immediately for visible rows
                                                tableApi
                                                    .rows({ page: "current" })
                                                    .every(function () {
                                                        const d = this.data();
                                                        const tr = this.node();
                                                        const on = next.includes(
                                                            d.id
                                                        );
                                                        tr.classList.toggle(
                                                            "dt-row-selected",
                                                            on
                                                        );
                                                        const cb =
                                                            tr.querySelector(
                                                                "input.row-check"
                                                            );
                                                        if (cb) cb.checked = on;
                                                    });
                                                return next;
                                            });
                                        }
                                    );
                                }
                            },

                            createdRow: (row, data) => {
                                // set initial state
                                if (isSelected(data.id))
                                    row.classList.add("dt-row-selected");
                                const cb = row.querySelector("input.row-check");
                                if (cb) {
                                    cb.checked = isSelected(data.id);
                                    cb.onchange = (e) => {
                                        toggleOne(data.id, row); // flip state + blue class
                                        // keep the header checkbox synced for the current page
                                        if (api) {
                                            const ids = api
                                                .rows({ page: "current" })
                                                .data()
                                                .toArray()
                                                .map((r) => r.id);
                                            const allSel =
                                                ids.length > 0 &&
                                                ids.every((id) =>
                                                    id === data.id
                                                        ? e.target.checked
                                                        : selected.includes(id)
                                                );
                                            const headerCb = api
                                                .table()
                                                .header()
                                                .querySelector("#check-all");
                                            if (headerCb) headerCb.checked = allSel;
                                        }
                                    };
                                }
                                // row click toggles (ignore clicks on action cell)
                                row.onclick = (e) => {
                                    const isAction =
                                        e.target.closest("td:last-child");
                                    const isInput =
                                        e.target.tagName.toLowerCase() === "input";
                                    if (isAction || isInput) return;
                                    toggleOne(data.id, row);
                                    const c = row.querySelector("input.row-check");
                                    if (c) c.checked = !c.checked;
                                };
                            },
                            drawCallback: function () {
                                const dt = this.api();
                                const ids = dt
                                    .rows({ page: "current" })
                                    .data()
                                    .toArray()
                                    .map((r) => r.id);
                                const allSel =
                                    ids.length > 0 &&
                                    ids.every((id) => selected.includes(id));
                                const headerCb = dt
                                    .table()
                                    .header()
                                    .querySelector("#check-all");
                                if (headerCb) headerCb.checked = allSel;
                                // ✅ also re-apply checkboxes and blue highlight when the page redraws
                                dt.rows({ page: "current" }).every(function () {
                                    const d = this.data();
                                    const tr = this.node();
                                    const on = selected.includes(d.id);
                                    tr.classList.toggle("dt-row-selected", on);
                                    const cb = tr.querySelector("input.row-check");
                                    if (cb) cb.checked = on;
                                });
                            },
                        }}
                        slots={{
                            action: (cellData, rowData) => (
                                <ActionMenu
                                    onEdit={() =>
                                        router.visit(
                                            route("customer.edit", rowData.id)
                                        )
                                    }
                                    onDelete={() =>
                                        confirmDelete(
                                            rowData.id,
                                            rowData.first_name
                                        )
                                    }
                                />
                            ),
                        }}
                    />
                </div>
            </ComponentCard>
        </div>
    );
}

export default Customers;