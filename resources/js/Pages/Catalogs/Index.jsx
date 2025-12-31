import React from 'react';
import DataTable from 'datatables.net-react';
import DT from 'datatables.net-dt';
import PageBreadcrumb from '@/Components/common/PageBreadCrumb';
import ComponentCard from '@/Components/common/ComponentCard';
import ActionMenu from '@/Components/ui/Action';
import { router } from '@inertiajs/react';
import toast from 'react-hot-toast';

DataTable.use(DT);

function Catalogs({ title = 'Catalog' }) {
  toast.success(`${title} list loaded successfully!`);

  const columns = [
    { data: 'DT_RowIndex', title: 'S.No', orderable: false, searchable: false },
    { data: 'name', title: 'Catalog Name' },
    { data: 'description', title: 'Description' },
    {
      data: 'image',
      title: 'Image',
      render: function (data) {
        if (!data) return '-';
        const fullPath = data.startsWith('http') ? data : `/storage/${data}`;
        return `<img src="${fullPath}" alt="Catalog Image" style="height: 40px; border-radius: 4px; object-fit: contain;" />`;
      },
      orderable: false,
      searchable: false,
    },
    { data: 'status', title: 'Status' },
    {
      data: 'action',
      name: 'action',
      title: 'Action',
      orderable: false,
      searchable: false,
    },
  ];

  return (
    <div>
      <PageBreadcrumb pageTitle={`${title} List`} />
      <ComponentCard
        url={route('catalogs.create')}
        urlText={`Create ${title}`}
        icon={null}
      >
        <DataTable
          ajax={route('catalogs.list')}
          columns={columns}
          className="display"
          options={{
            responsive: true,
            select: true,
            serverSide: true,
            processing: true,
            order: [[1, 'asc']],
          }}
          slots={{
            action: (cellData, rowData) => (
              <ActionMenu
                onEdit={() => router.visit(route('catalogs.edit', rowData.id))}
                onDelete={() => router.delete(route('catalogs.delete', rowData.id))}
              />
            ),
          }}
        />
      </ComponentCard>
    </div>
  );
}

export default Catalogs;
