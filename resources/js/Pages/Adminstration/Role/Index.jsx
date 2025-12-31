import React from 'react';
import DataTable from 'datatables.net-react';
import DT from 'datatables.net-dt';
import PageBreadcrumb from "@/Components/common/PageBreadCrumb";
import ComponentCard from "@/Components/common/ComponentCard";
import ActionMenu from '@/Components/ui/Action';
import { router , Head } from '@inertiajs/react';
DataTable.use(DT);

function Role({ title }) {
    const columns = [
        { data: 'DT_RowIndex', title: 'S.No', orderable: false, searchable: false },
        { data: 'name', title: 'Name' },
        { data: 'role_for', title: 'Role For' },
        { data: 'created_at', title: 'Created At' },
        {
            data: 'action', name: "action", title: 'Action', orderable: false, searchable: false
        }

    ];

    return (
        <div>
            <Head title={`${title} List`} />
            <PageBreadcrumb pageTitle={title + 's List'} />
            <ComponentCard url={route('role.create')} urlText={'Create ' + title} icon={null}  >
                <DataTable
                    ajax={route('role.list')}
                    columns={columns}
                    className="display"
                    options={{ responsive: true, select: true, serverSide: true, processing: true, order: [[1, 'desc']] }}
                    slots={{
                        action: (cellData, rowData) => (
                            <ActionMenu
                                onEdit={() => router.visit(route('role.edit', rowData.id))}
                                onDelete={() => router.delete(route('role.delete', rowData.id))}
                            />
                        ),
                    }}
                />
            </ComponentCard>
        </div>
    );
}

export default Role;
