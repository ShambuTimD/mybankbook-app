// resources/js/Pages/Admin/Bookings/Index.jsx
import React, { useEffect, useRef, useState } from 'react';
import DataTable from 'datatables.net-react';
import DT from 'datatables.net-dt';
import PageBreadcrumb from '@/Components/common/PageBreadCrumb';
import ComponentCard from '@/Components/common/ComponentCard';
import ActionMenu from '@/Components/ui/Action';
import { router } from '@inertiajs/react';
import toast from 'react-hot-toast';

DataTable.use(DT);

export default function BookingIndex({
  title = 'Bookings',
  statusOptions = ['pending', 'confirmed', 'cancelled', 'completed'],
  filters: initialFilters = {},
}) {
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);

  // STATUS FILTER + REF
  const [status, setStatus] = useState(initialFilters.booking_status || 'all');
  const tableRef = useRef(null);

  useEffect(() => {
    toast.success(`${title} list loaded successfully!`);
  }, [title]);

  // Reload (still keep this) – but we’ll also key the table to be bulletproof
  useEffect(() => {
    const api = tableRef.current?.dt?.();
    if (api) api.ajax.reload(null, true);
  }, [status]);

  const columns = [
    { data: 'id', title: 'Sys Id', orderable: true, searchable: false },
    { data: 'brn', title: 'BRN' },
    { data: 'company', title: 'Company' },
    { data: 'office', title: 'Office' },
    { data: 'pref_appointment_date', title: 'Preferred Date' },
    {
      data: 'booking_status',
      title: 'Status',
      render: (v) => {
        const map = {
          pending: 'bg-yellow-100 text-yellow-700',
          confirmed: 'bg-blue-100 text-blue-700',
          completed: 'bg-green-100 text-green-700',
          cancelled: 'bg-red-100 text-red-700',
        };
        const cls = map[(v || '').toLowerCase()] || 'bg-gray-100 text-gray-700';
        const label = v ? v.charAt(0).toUpperCase() + v.slice(1) : '';
        return `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${cls}">${label}</span>`;
      },
    },
    {
      data: null,
      title: 'Total Employees',
      render: (row) =>
        (parseInt(row?.total_employees || 0, 10) || 0) +
        (parseInt(row?.total_dependents || 0, 10) || 0),
    },
    { data: 'created_on', title: 'Created On' },
    { data: 'action', name: 'action', title: 'Action', orderable: false, searchable: false, defaultContent: '' },
  ];

  // ---- helper: pill list for medical conditions ----
  const renderMedical = (mc) => {
    if (!mc) return '-';
    let items = mc;
    if (!Array.isArray(items)) {
      try {
        const p = JSON.parse(mc);
        items = Array.isArray(p) ? p : String(mc).split(',');
      } catch {
        items = String(mc).split(',');
      }
    }
    const cleaned = items.map((s) => String(s).trim()).filter(Boolean);
    if (!cleaned.length) return '-';
    return (
      <div className="flex flex-wrap gap-1">
        {cleaned.map((item, i) => (
          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            {item}
          </span>
        ))}
      </div>
    );
  };

  const roleStyles = {
    employee: {
      chip: 'bg-blue-100 text-blue-700',
      card: 'bg-blue-50/40 ring-1 ring-blue-200',
      header: 'text-blue-800',
      toggleBtn: 'border-blue-300 hover:bg-blue-50 text-blue-700',
    },
    dependent: {
      chip: 'bg-violet-100 text-violet-700',
      card: 'bg-violet-50/40 ring-1 ring-violet-200',
      header: 'text-violet-800',
    },
  };

  const ViewModal = () => {
    if (!viewOpen || !viewData) return null;

    const b = viewData;
    const details = b?.details || [];
    const employees = details.filter((d) => d.applicant_type === 'employee');
    const dependents = details.filter((d) => d.applicant_type === 'dependent');
    const depsByEmp = dependents.reduce((acc, d) => {
      const empId = d?.dependent?.emp_id ?? d?.emp_id ?? d?.employee?.id ?? null;
      if (!empId) return acc;
      (acc[empId] = acc[empId] || []).push(d);
      return acc;
    }, {});
    const [openEmp, setOpenEmp] = useState({});
    const toggle = (empId) => setOpenEmp((s) => ({ ...s, [empId]: !s[empId] }));

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold">Booking Details — {b?.brn}</h3>
            <button className="text-gray-500 hover:text-gray-700" onClick={() => setViewOpen(false)}>✕</button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Company:</span> {b?.company?.name}</div>
              <div><span className="font-medium">Office:</span> {b?.office?.office_name}</div>
              <div><span className="font-medium">Status:</span> {b?.booking_status}</div>
              <div><span className="font-medium">Preferred Date:</span> {b?.pref_appointment_date}</div>
              <div><span className="font-medium">Requested By:</span> {b?.requested_by?.name} ({b?.requested_by?.email})</div>
              <div><span className="font-medium">Totals:</span> Emp {b?.total_employees} / Dep {b?.total_dependents}</div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Applicants</h4>
              <div className="space-y-3">
                {employees.map((e) => {
                  const empId = e?.employee?.id ?? e?.emp_id ?? e?.id;
                  const list = depsByEmp[empId] || [];
                  const expanded = !!openEmp[empId];
                  const s = roleStyles.employee;
                  return (
                    <div key={`emp-${empId || e.id}`} className={`p-3 rounded-lg ${s.card}`}>
                      <div className="flex items-start justify-between">
                        <div className={`font-semibold ${s.header}`}>{e.full_name}</div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggle(empId)}
                            className={`text-xs px-3 py-1 rounded-md border ${s.toggleBtn}`}
                            title={expanded ? 'Hide dependents' : 'Show dependents'}
                          >
                            {expanded ? 'Hide dependents' : `Show dependents (${list.length})`}
                          </button>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${s.chip}`}>employee</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-gray-700">
                        <div>Gender: {e.gender || '-'}</div>
                        <div>Age: {e.age || '-'}</div>
                        <div>Relation: -</div>
                        <div>Email: {e.email || '-'}</div>
                        <div>Phone: {e.phone || '-'}</div>
                        <div>Designation: {e.designation || '-'}</div>
                        <div className="col-span-3">
                          <span className="mr-2 font-medium text-gray-800">Medical:</span>
                          {renderMedical(e.medical_conditions)}
                        </div>
                        {e.remarks ? (
                          <div className="col-span-3">
                            <span className="mr-2 font-medium text-gray-800">Remarks:</span>
                            <span className="text-gray-700">{e.remarks}</span>
                          </div>
                        ) : null}
                      </div>

                      {expanded && list.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {list.map((d) => {
                            const sd = roleStyles.dependent;
                            return (
                              <div key={`dep-${d.id}`} className={`p-3 rounded-md ${sd.card}`}>
                                <div className="flex items-center justify-between">
                                  <div className={`font-medium ${sd.header}`}>{d.full_name}</div>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${sd.chip}`}>dependent</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-gray-700">
                                  <div>Gender: {d.gender || '-'}</div>
                                  <div>Age: {d.age || '-'}</div>
                                  <div>Relation: {d.emp_relation || d?.dependent?.emp_relation || '-'}</div>
                                  <div>Email: {d.email || '-'}</div>
                                  <div>Phone: {d.phone || '-'}</div>
                                  <div>Designation: -</div>
                                  <div className="col-span-3">
                                    <span className="mr-2 font-medium text-gray-800">Medical:</span>
                                    {renderMedical(d.medical_conditions)}
                                  </div>
                                  {d.remarks ? (
                                    <div className="col-span-3">
                                      <span className="mr-2 font-medium text-gray-800">Remarks:</span>
                                      <span className="text-gray-700">{d.remarks}</span>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="px-5 py-3 border-t text-right">
            <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={() => setViewOpen(false)}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageBreadcrumb pageTitle={`${title} List`} />

      <ComponentCard url={null} urlText={null} icon={null}>
        {/* Filter Row */}
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium">Filter by Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 min-w-[200px] rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          key={status}               // <- force rebuild when filter changes
          ref={tableRef}
          ajax={{
            url: route('booking.list'),
            type: 'GET',
            data: (d) => {
              // IMPORTANT: return merged payload so DataTables actually sends it
              return {
                ...d,
                booking_status: status === 'all' ? '' : status,
              };
            },
            dataSrc: 'data',
          }}
          columns={columns}
          className="display"
          options={{
            responsive: true,
            select: true,
            serverSide: true,
            processing: true,
            order: [[0, 'desc']],
            columnDefs: [{ targets: -1, orderable: false, searchable: false, defaultContent: '' }],
            deferRender: true,
          }}
          slots={{
            action: (cellData, row) => {
              const viewUrl = row?.action?.view_url;
              const editUrl = row?.action?.edit_url;
              const statusUrl = row?.action?.status_url;
              const deleteUrl = row?.action?.delete_url;

              return (
                <ActionMenu
                  onView={async () => {
                    if (!viewUrl) return toast.error('View URL missing');
                    try {
                      const res = await fetch(viewUrl, { headers: { Accept: 'application/json' } });
                      const json = await res.json();
                      if (json?.success) {
                        setViewData(json.data);
                        setViewOpen(true);
                      } else {
                        toast.error(json?.message || 'Failed to load details');
                      }
                    } catch {
                      toast.error('Request failed');
                    }
                  }}
                  onEdit={() => {
                    if (!editUrl) return toast.error('Edit URL missing');
                    router.visit(editUrl);
                  }}
                  onDelete={() => {
                    if (!deleteUrl) return toast.error('Delete URL missing');
                    if (confirm('This will permanently delete the booking and its details. Continue?')) {
                      router.delete(deleteUrl, {
                        preserveScroll: true,
                        onSuccess: () => toast.success('Booking deleted'),
                        onError: (e) => toast.error(e?.message || 'Delete failed'),
                      });
                    }
                  }}
                //   extra={[
                //     {
                //       label: 'Mark Confirmed',
                //       onClick: () => {
                //         if (!statusUrl) return toast.error('Status URL missing');
                //         router.patch(statusUrl, {
                //           booking_status: 'confirmed',
                //           preserveScroll: true,
                //           onSuccess: () => toast.success('Status updated to Confirmed'),
                //           onError: (e) => toast.error(e?.message || 'Update failed'),
                //         });
                //       },
                //     },
                //     {
                //       label: 'Mark Completed',
                //       onClick: () => {
                //         if (!statusUrl) return toast.error('Status URL missing');
                //         router.patch(statusUrl, {
                //           booking_status: 'completed',
                //           preserveScroll: true,
                //           onSuccess: () => toast.success('Status updated to Completed'),
                //           onError: (e) => toast.error(e?.message || 'Update failed'),
                //         });
                //       },
                //     },
                //     {
                //       label: 'Mark Cancelled',
                //       onClick: () => {
                //         if (!statusUrl) return toast.error('Status URL missing');
                //         router.patch(statusUrl, {
                //           booking_status: 'cancelled',
                //           preserveScroll: true,
                //           onSuccess: () => toast.success('Status updated to Cancelled'),
                //           onError: (e) => toast.error(e?.message || 'Update failed'),
                //         });
                //       },
                //     },
                //   ]}
                />
              );
            },
          }}
        />
      </ComponentCard>

      <ViewModal />
    </div>
  );
}
