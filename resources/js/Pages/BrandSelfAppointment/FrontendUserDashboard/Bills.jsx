import React, { useRef } from "react";
import Metricsgrid from "@/Components/analytics/Metricsgrid";
import ComponentCard from "@/Components/common/ComponentCard";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";

DataTable.use(DT);

export default function Bills() {
  const tableRef = useRef(null);

  const bills = []; // ✅ Empty dataset (table will still render headers)

  const columns = [
    { data: "invoice_no", title: "Invoice No." },
    { data: "period", title: "Period" },
    { data: "office", title: "Office" },
    { data: "amount", title: "Amount" },
    {
      data: "status",
      title: "Status",
      render: (v) => {
        const map = {
          Paid: "bg-green-100 text-green-700",
          Pending: "bg-yellow-100 text-yellow-700",
          Overdue: "bg-red-100 text-red-700",
        };
        const cls = map[v] || "bg-gray-100 text-gray-700";
        return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${cls}">${v || ""}</span>`;
      },
    },
    { data: "due_date", title: "Due Date" },
    {
      data: "download",
      title: "Download",
      render: () =>
        `<a href="#" class="text-blue-600 hover:underline">Download</a>`,
      orderable: false,
      searchable: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* If you want to show metrics above, uncomment below */}
      {/* <Metricsgrid /> */}

      <ComponentCard>
        <h2 className="text-lg font-semibold mb-4">Bills List</h2>

        <DataTable
          ref={tableRef}
          data={bills} // 👈 Table always renders, even if empty
          columns={columns}
          className="display nowrap w-100"
          options={{
            paging: true,
            searching: true,
            ordering: true,
            responsive: true,
            pageLength: 10,
            lengthMenu: [10, 25, 50, 100],
            language: {
              emptyTable: "No data available", // 👈 Custom empty message
            },
          }}
        />
      </ComponentCard>
    </div>
  );
};
