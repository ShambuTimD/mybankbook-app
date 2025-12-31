import React from "react";
import { Filter } from "lucide-react"; // optional: replace inline SVG with lucide icon

// Example data
const orders = [
  {
    product: "TailGrids",
    category: "UI Kit",
    country: "country-01.svg",
    cr: "Dashboard",
    value: "$12,499",
  },
  {
    product: "GrayGrids",
    category: "Templates",
    country: "country-03.svg",
    cr: "Dashboard",
    value: "$5,498",
  },
  {
    product: "Uideck",
    category: "Templates",
    country: "country-04.svg",
    cr: "Dashboard",
    value: "$4,521",
  },
  {
    product: "FormBold",
    category: "SaaS",
    country: "country-05.svg",
    cr: "Dashboard",
    value: "$13,843",
  },
  {
    product: "NextAdmin",
    category: "Dashboard",
    country: "country-06.svg",
    cr: "Dashboard",
    value: "$7,523",
  },
  {
    product: "Form Builder",
    category: "SaaS",
    country: "country-07.svg",
    cr: "Dashboard",
    value: "$1,377",
  },
  {
    product: "AyroUI",
    category: "UI Kit",
    country: "country-08.svg",
    cr: "Dashboard",
    value: "$599,00",
  },
];

export default function RecentOrdersCard({ data = orders }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white pt-4 dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Orders
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button className="text-theme-sm shadow-theme-xs inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            <Filter size={18} />
            Filter
          </button>

          <button className="text-theme-sm shadow-theme-xs inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            See all
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="custom-scrollbar max-w-full overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-t border-gray-100 dark:border-gray-800">
              {["Products", "Category", "Country", "CR", "Value"].map(
                (heading, i) => (
                  <th key={i} className="px-6 py-3 text-left">
                    <p className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                      {heading}
                    </p>
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((order, idx) => (
              <tr
                key={idx}
                className="border-t border-gray-100 dark:border-gray-800"
              >
                <td className="px-6 py-3.5">
                  <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    {order.product}
                  </p>
                </td>
                <td className="px-6 py-3.5">
                  <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                    {order.category}
                  </p>
                </td>
                <td className="px-6 py-3.5">
                  <div className="h-5 w-5 overflow-hidden rounded-full">
                    <img
                      src={`/images/country/${order.country}`}
                      alt="country"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                    {order.cr}
                  </p>
                </td>
                <td className="px-6 py-3.5">
                  <p className="text-theme-sm text-success-600">
                    {order.value}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
