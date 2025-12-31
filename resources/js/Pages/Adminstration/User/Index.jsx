import React from 'react';
import DataTable from 'datatables.net-react';
import DT from 'datatables.net-dt';
import PageBreadcrumb from "@/Components/common/PageBreadCrumb";
import ComponentCard from "@/Components/common/ComponentCard";
import ActionMenu from '@/Components/ui/Action';
import { router , Head } from '@inertiajs/react';
import toast from 'react-hot-toast';
DataTable.use(DT);

function User({ title }) {
    toast.success('User list loaded successfully!'
    )
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
            <ComponentCard  url={route('user.create')} urlText={'Create ' + title} icon={null}  >

                <DataTable
                    ajax={route('user.list')}
                    columns={columns}
                    className="display"
                    options={{ responsive: true, select: true, serverSide: true, processing: true, order: [[1, 'asc']] }}
                    slots={{
                        action: (cellData, rowData) => (
                            <ActionMenu
                                onEdit={() => router.visit(route('user.edit', rowData.id))}
                                onDelete={() => router.delete(route('user.delete', rowData.id))}
                            />
                        ),
                    }}
                />
            </ComponentCard>
        </div>
    );
}

export default User;
