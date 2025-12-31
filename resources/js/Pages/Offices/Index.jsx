// resources/js/Pages/Offices/Index.jsx

import { Head, router } from '@inertiajs/react';
import PageBreadcrumb from '@/Components/common/PageBreadCrumb';
import ComponentCard from '@/Components/common/ComponentCard';
import DataTable from 'datatables.net-react';
import DT from 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import toast from 'react-hot-toast';
import ActionMenu from '@/Components/ui/Action';
import { useEffect } from 'react';

DataTable.use(DT);

export default function CompanyOffices({ title = 'Company Office' }) {
  const columns = [
    { data: 'id', title: 'Sys Id', orderable: false, searchable: false },
    { data: 'office_name', title: 'Office Name' },
    { data: 'company_name', title: 'Company' },
    {
      data: 'status',
      title: 'Status',
      render: (data, type, row) => {
        const checked = data === 'active' ? 'checked' : '';
        return `
          <label class="switch">
            <input type="checkbox" class="office-status-toggle" data-id="${row.id}" data-current="${data}" ${checked}>
            <span class="slider round"></span>
          </label>
        `;
      },
      orderable: false,
      searchable: false,
    },
    {
      data: 'action',
      name: 'action',
      title: 'Action',
      orderable: false,
      searchable: false,
    },
  ];

  // ✅ exactly one delegated listener with cleanup, confirm + revert on error
  useEffect(() => {
    const tableEl = document.querySelector('.display');
    if (!tableEl) return;

    const tokenEl = document.querySelector('meta[name="csrf-token"]');
    const csrf = tokenEl?.getAttribute('content') || '';
    const pending = new Set(); // prevent double clicks per office id

    const onChange = async (e) => {
      const t = e.target;
      if (!(t && t.classList && t.classList.contains('office-status-toggle'))) return;

      const id = t.dataset.id;
      if (!id || pending.has(id)) return;

      const willBeActive = t.checked;
      const next = willBeActive ? 'active' : 'inactive';
      const current = t.dataset.current || (willBeActive ? 'inactive' : 'active');

      const ok = window.confirm(`Are you sure you want to set status to "${next}"?`);
      if (!ok) {
        t.checked = current === 'active';
        return;
      }

      try {
        pending.add(id);
        t.disabled = true;

        const res = await fetch(route('companyOffice.toggle-status', id), {
          method: 'PATCH',
          headers: {
            'X-CSRF-TOKEN': csrf,
            'X-Requested-With': 'XMLHttpRequest',
            Accept: 'application/json',
          },
          credentials: 'same-origin',
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data?.success) {
          const isActive = data.status === 'active';
          t.checked = isActive;
          t.dataset.current = data.status;
          toast.success(`Status updated to ${data.status}`);
        } else {
          t.checked = current === 'active';
          toast.error('Failed to update status.');
        }
      } catch (err) {
        t.checked = current === 'active';
        toast.error('Error updating status.');
        console.error(err);
      } finally {
        pending.delete(id);
        t.disabled = false;
      }
    };

    tableEl.addEventListener('change', onChange);
    return () => {
      tableEl.removeEventListener('change', onChange);
    };
  }, []);

  return (
    <div>
      <Head title={`${title} List`} />
      <PageBreadcrumb pageTitle={`${title} List`} />
      <ComponentCard
        title={`${title} List`}
        url={route('companyOffice.create')}
        urlText={`Create ${title}`}
        icon={null}
      >
        <DataTable
          ajax={route('companyOffice.list')}
          columns={columns}
          className="display"
          options={{
            responsive: true,
            select: true,
            serverSide: true,
            processing: true,
            order: [[0, 'desc']],
          }}
          slots={{
            action: (cellData, rowData) => (
              <ActionMenu
                onEdit={() => router.visit(route('companyOffice.edit', rowData.id))}
                onDelete={() => {
                  if (confirm('Are you sure you want to deactivate this office?')) {
                    router.delete(route('companyOffice.destroy', rowData.id));
                  }
                }}
              />
            ),
          }}
        />
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
    </div>
  );
}
