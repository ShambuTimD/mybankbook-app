import React, { useMemo } from "react";
import Chart from "react-apexcharts";
import ChartTab from "@/Components/common/ChartTab";

export default function StatisticsChart({ bookingStats = [] }) {
  // ✅ Use memoization for efficiency
  const { months, bookingsData, revenueData } = useMemo(() => {
    if (!bookingStats || bookingStats.length === 0) {
      return {
        months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        bookingsData: [180, 190, 170, 160, 175, 165, 170, 205, 230, 210, 240, 235],
        revenueData: [40000, 30000, 50000, 40000, 55000, 40000, 70000, 100000, 110000, 120000, 150000, 140000],
      };
    }

    return {
      months: bookingStats.map((item) => item.month || ""),
      bookingsData: bookingStats.map((item) => item.bookings ?? 0),
      revenueData: bookingStats.map((item) => item.revenue ?? 0),
    };
  }, [bookingStats]);

  const options = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line",
      toolbar: { show: false },
    },
    colors: ["#465FFF", "#9CB9FF"],
    stroke: { curve: "smooth", width: [3, 3] },
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        opacityFrom: 0.5,
        opacityTo: 0.1,
      },
    },
    markers: {
      size: 4,
      strokeColors: "#fff",
      hover: { size: 6 },
    },
    grid: {
      strokeDashArray: 4,
      borderColor: "#E5E7EB",
    },
    dataLabels: { enabled: false },
    tooltip: {
      shared: true,
      intersect: false,
      y: [
        {
          formatter: (val) => `${val} Bookings`,
        },
        {
          formatter: (val) => `₹${val.toLocaleString("en-IN")}`,
        },
      ],
    },
    xaxis: {
      categories: months,
      labels: { style: { colors: "#6B7280", fontSize: "12px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: [
      {
        labels: {
          style: { colors: "#6B7280", fontSize: "12px" },
          formatter: (val) => `${val}`,
        },
        title: { text: "Bookings" },
      },
      {
        opposite: true,
        labels: {
          style: { colors: "#6B7280", fontSize: "12px" },
          formatter: (val) => `₹${val.toLocaleString("en-IN")}`,
        },
        title: { text: "Revenue" },
      },
    ],
    legend: {
      position: "top",
      horizontalAlign: "right",
      labels: { colors: "#6B7280" },
    },
  };

  const series = [
    { name: "Bookings", type: "line", data: bookingsData },
    { name: "Revenue (₹)", type: "area", data: revenueData },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Booking & Revenue Trends
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Month-wise bookings and revenue performance
          </p>
        </div>
        <div className="flex items-start w-full gap-3 sm:justify-end">
          <ChartTab />
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <Chart options={options} series={series} type="line" height={310} />
        </div>
      </div>
    </div>
  );
}
