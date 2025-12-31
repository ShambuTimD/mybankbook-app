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

DataTable.use(DT);

function Customers({ title = "Customer" }) {
    const flash = usePage().props.flash || {};

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

    const columns = [
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

    // delete confirmation
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
                <DataTable
                    ajax={route("customer.list")} // Now this route exists!
                    columns={columns}
                    className="display"
                    options={{
                        responsive: true,
                        select: true,
                        serverSide: true,
                        processing: true,
                        order: [[5, "desc"]],
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
                                    confirmDelete(rowData.id, rowData.first_name)
                                }
                            />
                        ),
                    }}
                />
            </ComponentCard>
        </div>
    );
}

export default Customers;
