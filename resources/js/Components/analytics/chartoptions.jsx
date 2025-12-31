import React, { useState } from "react";
import Chart from "react-apexcharts";

const AnalyticsCard = () => {
  const [selected, setSelected] = useState("12m");

  const ranges = {
    "12m": "12 months",
    "30d": "30 days",
    "7d": "7 days",
    "24h": "24 hours",
  };

  // Example datasets
  const datasets = {
    "12m": Array.from({ length: 12 }, () =>
      Math.floor(Math.random() * 400 + 50)
    ),
    "30d": Array.from({ length: 30 }, () =>
      Math.floor(Math.random() * 400 + 50)
    ),
    "7d": Array.from({ length: 7 }, () => Math.floor(Math.random() * 400 + 50)),
    "24h": Array.from({ length: 24 }, () =>
      Math.floor(Math.random() * 400 + 50)
    ),
  };

  const chartOptions = {
    chart: {
      type: "bar",
      height: 350,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: "40%",
      },
    },
    xaxis: {
      categories: Array.from(
        { length: datasets[selected].length },
        (_, i) => i + 1
      ),
    },
    dataLabels: { enabled: false },
    colors: ["#3b82f6"], // blue-500
    tooltip: {
      y: {
        formatter: (val) => `${val} Sales`,
      },
    },
  };

  const chartSeries = [
    {
      name: "Sales",
      data: datasets[selected],
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
            Analytics
          </h3>
          <span className="block text-theme-sm text-gray-500 dark:text-gray-400">
            Visitor analytics of last 30 days
          </span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
          {Object.entries(ranges).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`rounded-md px-3 py-2 text-theme-sm font-medium ${
                selected === key
                  ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="custom-scrollbar max-w-full overflow-x-auto">
        <Chart
          options={chartOptions}
          series={chartSeries}
          type="bar"
          height={350}
        />
      </div>
    </div>
  );
};

export default AnalyticsCard;
