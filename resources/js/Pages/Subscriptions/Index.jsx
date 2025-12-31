import React, { useRef, useState } from "react";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import PageBreadcrumb from "@/Components/common/PageBreadCrumb";
import ComponentCard from "@/Components/common/ComponentCard";
import ActionMenu from "@/Components/ui/Action";
import { Head, router } from "@inertiajs/react";
import axios from "axios";
import Select from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faSearch,
    faRotate,
    faEye,
    faPenToSquare,
    faEllipsisVertical,
} from "@fortawesome/free-solid-svg-icons";

DataTable.use(DT);

export default function Index({ title, billingCycles }) {
    const tableRef = useRef(null);

    const [search, setSearch] = useState("");
    const [billingCycle, setBillingCycle] = useState("");
    const [status, setStatus] = useState("all");

    /* 🔄 Reload helper */
    const reload = () => tableRef.current?.dt()?.ajax.reload(null, true);

    const columns = [
        {
            data: "id",
            title: "",
            orderable: false,
            render: () => `<input type="checkbox" />`,
        },
        { data: "id", title: "SID" },
        { data: "name", title: "Plan Name" },
        { data: "billing_cycle", title: "Billing Cycle" },
        { data: "price", title: "Price" },
        { data: "features_count", title: "Features" },
        { data: "status_badge", title: "Status", orderable: false },
        {
            data: "action",
            title: "Action",
            orderable: false,
            searchable: false,
        },
    ];

    return (
        <div>
            <Head title={title} />
            <PageBreadcrumb pageTitle={title} />

            <ComponentCard
                url={route("subscriptions.create")}
                urlText="Create Plan"
                icon={null}
            >
                {/* ✅ WRAPPED for Custom Search Positioning */}
                <div className="dt-wrapper-relative">
                    {/* ✅ Custom Search Box */}
                    <div className="dt-custom-search-box">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FontAwesomeIcon
                                    icon={faSearch}
                                    className="text-gray-400"
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Search Plans..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    reload();
                                }}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-64 transition-shadow bg-white"
                            />
                        </div>
                    </div>

                    <DataTable
                        ref={tableRef} // ✅ attach ref
                        ajax={{
                            url: route("subscriptions.list"),
                            data: {
                                search_term: search,
                                billing_cycle: billingCycle,
                                status: status === "all" ? "" : status,
                            },
                            dataSrc: "data",
                        }}
                        columns={columns}
                        className="display nowrap w-100"
                        options={{
                            responsive: false,
                            scrollX: true,
                            scrollY: "350px",
                            select: true,
                            serverSide: true,
                            processing: true,
                            searching: true,
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
                                    onView={() =>
                                        router.visit(
                                            route("subscriptions.show", row.id)
                                        )
                                    }
                                    viewIcon={<FontAwesomeIcon icon={faEye} />}
                                    onEdit={() =>
                                        router.visit(
                                            route("subscriptions.edit", row.id)
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
