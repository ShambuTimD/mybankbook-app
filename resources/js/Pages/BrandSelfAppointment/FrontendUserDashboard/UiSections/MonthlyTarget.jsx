import Chart from "react-apexcharts";
import { useState, useMemo } from "react";
import { Dropdown } from "@/Components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/Components/ui/dropdown/DropdownItem";

export default function MonthlyTarget({ monthlyData = {} }) {
  const [isOpen, setIsOpen] = useState(false);

  // ✅ Extract and normalize data safely
  const target = Number(monthlyData.target) || 20000; // Monthly target
  const revenue = Number(monthlyData.revenue) || 15500; // Achieved revenue
  const today = Number(monthlyData.today_revenue) || 3287; // Today’s revenue
  const growth = Number(monthlyData.growth_percentage) || 10; // Growth %

  // ✅ Calculate progress (Revenue ÷ Target × 100)
  const progress = target > 0 ? ((revenue / target) * 100).toFixed(2) : 0;

  // ✅ Memoized Chart Configuration
  const { series, options } = useMemo(() => {
    return {
      series: [parseFloat(progress)],
      options: {
        colors: ["#465FFF"],
        chart: {
          fontFamily: "Outfit, sans-serif",
          type: "radialBar",
          height: 330,
          sparkline: { enabled: true },
        },
        plotOptions: {
          radialBar: {
            startAngle: -85,
            endAngle: 85,
            hollow: { size: "80%" },
            track: {
              background: "#E4E7EC",
              strokeWidth: "100%",
              margin: 5,
            },
            dataLabels: {
              name: { show: false },
              value: {
                fontSize: "36px",
                fontWeight: "600",
                offsetY: -40,
                color: "#1D2939",
                formatter: (val) => `${val}%`,
              },
            },
          },
        },
        fill: { type: "solid", colors: ["#465FFF"] },
        stroke: { lineCap: "round" },
        labels: ["Progress"],
      },
    };
  }, [progress]);

  // Dropdown handlers
  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        {/* Header */}
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Monthly Target
            </h3>
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Target vs Achieved Revenue for this Month
            </p>
          </div>

          {/* Dropdown Menu */}
          <div className="relative inline-block">
            <button className="dropdown-toggle" onClick={toggleDropdown}>
              {/* Optional menu icon */}
            </button>
            <Dropdown
              isOpen={isOpen}
              onClose={closeDropdown}
              className="w-40 p-2"
            >
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                View More
              </DropdownItem>
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Delete
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        {/* Chart Section */}
        <div className="relative">
          <div className="max-h-[330px]" id="chartDarkStyle">
            <Chart options={options} series={series} type="radialBar" height={330} />
          </div>

          <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
            +{growth}%
          </span>
        </div>

        {/* Dynamic Summary */}
        <p className="mx-auto mt-10 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
          You earned ₹{today.toLocaleString("en-IN")} today — higher than last month.
          Keep up the great work!
        </p>
      </div>

      {/* Footer Summary (Target, Revenue, Today) */}
      <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
        {/* Target */}
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Target
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            ₹{target.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        {/* Revenue */}
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Revenue
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            ₹{revenue.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

        {/* Today */}
        <div>
          <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
            Today
          </p>
          <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
            ₹{today.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
    </div>
  );
}
