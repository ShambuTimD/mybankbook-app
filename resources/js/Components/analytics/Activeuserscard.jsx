import React, { useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { MoreVertical } from "lucide-react";

const data = [
  { name: "Mon", value: 200 },
  { name: "Tue", value: 320 },
  { name: "Wed", value: 150 },
  { name: "Thu", value: 280 },
  { name: "Fri", value: 250 },
  { name: "Sat", value: 330 },
  { name: "Sun", value: 300 },
];

const ActiveUsersCard = () => {
  const [activeUsers] = useState(217);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow">
      {/* Header */}
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Active Users
        </h3>
        <button className="text-gray-400 hover:text-gray-700 dark:hover:text-white">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Live visitors */}
      <div className="mt-6 flex items-end gap-1.5">
        <div className="flex items-center gap-2.5">
          <span className="relative inline-block w-5 h-5">
            <span className="absolute w-2 h-2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 top-1/2 left-1/2">
              <span className="absolute inline-flex w-4 h-4 rounded-full opacity-75 bg-red-400 -top-1 -left-1 animate-ping"></span>
            </span>
          </span>
          <span className="font-semibold text-gray-800 text-2xl dark:text-white/90">
            {activeUsers}
          </span>
        </div>
        <span className="block mb-1 text-gray-500 text-theme-sm dark:text-gray-400">
          Live visitors
        </span>
      </div>

      {/* Chart */}
      <div className="my-5 min-h-[155px] rounded-xl bg-gray-50 dark:bg-gray-900 p-2">
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={data}>
            <Tooltip cursor={false} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#4F46E5"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-6">
        <div>
          <p className="text-lg font-semibold text-center text-gray-800 dark:text-white/90">
            224
          </p>
          <p className="text-theme-xs mt-0.5 text-center text-gray-500 dark:text-gray-400">
            Avg, Daily
          </p>
        </div>

        <div className="w-px bg-gray-200 h-11 dark:bg-gray-800"></div>

        <div>
          <p className="text-lg font-semibold text-center text-gray-800 dark:text-white/90">
            1.4K
          </p>
          <p className="text-theme-xs mt-0.5 text-center text-gray-500 dark:text-gray-400">
            Avg, Weekly
          </p>
        </div>

        <div className="w-px bg-gray-200 h-11 dark:bg-gray-800"></div>

        <div>
          <p className="text-lg font-semibold text-center text-gray-800 dark:text-white/90">
            22.1K
          </p>
          <p className="text-theme-xs mt-0.5 text-center text-gray-500 dark:text-gray-400">
            Avg, Monthly
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActiveUsersCard;
