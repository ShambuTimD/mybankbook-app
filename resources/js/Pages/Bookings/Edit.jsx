// resources/js/Pages/Admin/Bookings/Edit.jsx
import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import ComponentCard from '@/Components/common/ComponentCard';
import toast from 'react-hot-toast';

const ReadonlyInput = ({ label, value }) => (
  <div className="grid gap-1">
    <label className="text-xs font-medium text-gray-600">{label}</label>
    <input
      type="text"
      value={value ?? ''}
      readOnly
      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
    />
  </div>
);

export default function Edit({
  title = 'Edit Booking',
  booking,
  statusOptions = ['pending', 'confirmed', 'cancelled', 'completed'],
  updateRoute,
}) {
  const [status, setStatus] = useState(booking?.booking_status || 'pending');

  const submit = (e) => {
    e.preventDefault();
    router.patch(
      updateRoute,
      { booking_status: status },
      {
        preserveScroll: true,
        onSuccess: () => toast.success('Status updated'),
        onError: (e) => toast.error(e?.message || 'Update failed'),
      }
    );
  };

  const applicants = Array.isArray(booking?.details) ? booking.details : [];

  return (
    <>
      <Head title={title} />

      <ComponentCard title={`${title} — ${booking?.brn || ''}`}>
        <form onSubmit={submit} className="space-y-8">
          {/* Booking master (readonly) */}
          <section>
            <h3 className="mb-3 text-base font-semibold">Booking Info</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ReadonlyInput label="BRN" value={booking?.brn} />
              <ReadonlyInput label="Preferred Date" value={booking?.pref_appointment_date} />
              <ReadonlyInput label="Company" value={booking?.company?.name} />
              <ReadonlyInput label="Office" value={booking?.office?.office_name} />
              <ReadonlyInput
                label="Requested By"
                value={
                  booking?.requested_by
                    ? `${booking.requested_by.name} (${booking.requested_by.email})`
                    : ''
                }
              />
              <ReadonlyInput
                label="Totals"
                value={`Employees: ${booking?.total_employees || 0}  /  Dependents: ${
                  booking?.total_dependents || 0
                }`}
              />
            </div>
          </section>

          {/* Editable status */}
          <section>
            <h3 className="mb-3 text-base font-semibold">Update Status</h3>
            <div className="grid gap-2 max-w-xs">
              <label className="text-sm font-medium">Status</label>
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Applicants (readonly) */}
          <section>
            <h3 className="mb-3 text-base font-semibold">Applicants</h3>
            <div className="space-y-3">
              {applicants.map((d) => (
                <div
                  key={d.id}
                  className={`rounded-lg border p-4 ${
                    d.applicant_type === 'employee'
                      ? 'border-blue-200 bg-blue-50/40'
                      : 'border-violet-200 bg-violet-50/40'
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm font-semibold">{d.full_name}</div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        d.applicant_type === 'employee'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-violet-100 text-violet-700'
                      }`}
                    >
                      {d.applicant_type}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <ReadonlyInput label="Gender" value={d.gender} />
                    <ReadonlyInput label="Age" value={d.age} />
                    <ReadonlyInput
                      label="Relation"
                      value={d.emp_relation ?? d?.dependent?.emp_relation}
                    />
                    <ReadonlyInput label="Email" value={d.email} />
                    <ReadonlyInput label="Phone" value={d.phone} />
                    <ReadonlyInput
                      label="Designation"
                      value={d.designation ?? (d.applicant_type === 'dependent' ? '-' : '')}
                    />
                    <ReadonlyInput
                      label="Medical Conditions"
                      value={
                        Array.isArray(d.medical_conditions)
                          ? d.medical_conditions.join(', ')
                          : d.medical_conditions || ''
                      }
                    />
                    <ReadonlyInput label="Remarks" value={d.remarks} />
                  </div>
                </div>
              ))}

              {!applicants.length && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                  No applicants found.
                </div>
              )}
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Update
            </button>
            <button
              type="button"
              onClick={() => router.visit(route('booking.index'))}
              className="rounded-lg bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
}
