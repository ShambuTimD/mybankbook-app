import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MoreVertical } from "lucide-react";

const data = [
  { month: "Jan", Direct: 45, Referral: 20, Organic: 15, Social: 10 },
  { month: "Feb", Direct: 55, Referral: 25, Organic: 15, Social: 5 },
  { month: "Mar", Direct: 50, Referral: 30, Organic: 15, Social: 5 },
  { month: "Apr", Direct: 65, Referral: 20, Organic: 10, Social: 8 },
  { month: "May", Direct: 30, Referral: 15, Organic: 20, Social: 12 },
  { month: "Jun", Direct: 40, Referral: 25, Organic: 20, Social: 15 },
];

export default function AcquisitionChannelsCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Acquisition Channels
        </h3>
        <button className="text-gray-400 hover:text-gray-700 dark:hover:text-white">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Chart */}
      <div className="custom-scrollbar max-w-full overflow-x-auto">
        <div className="-ml-5 min-w-[700px] pl-2 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={30}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Direct" stackId="a" fill="#3b82f6" />
              <Bar dataKey="Referral" stackId="a" fill="#2563eb" />
              <Bar dataKey="Organic" stackId="a" fill="#60a5fa" />
              <Bar dataKey="Social" stackId="a" fill="#93c5fd" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
