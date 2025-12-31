import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { MoreVertical } from "lucide-react";

const data = [
  { name: "Desktop", value: 60 },
  { name: "Mobile", value: 25 },
  { name: "Tablet", value: 15 },
];

const COLORS = ["#3b82f6", "#6366f1", "#93c5fd"]; // Tailwind blues

export default function SessionsByDeviceCard() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="mb-9 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Sessions By Device
        </h3>
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className={`${
              open
                ? "text-gray-700 dark:text-white"
                : "text-gray-400 hover:text-gray-700 dark:hover:text-white"
            }`}
          >
            <MoreVertical size={22} />
          </button>

          {open && (
            <div className="absolute right-0 top-full z-40 mt-2 w-40 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-800 dark:bg-gray-900">
              <button className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">
                View More
              </button>
              <button className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="flex justify-center">
        <ResponsiveContainer width={250} height={250}>
          <PieChart>
            <Pie
              data={data}
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              layout="horizontal"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
