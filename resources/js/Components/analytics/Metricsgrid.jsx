import React from "react";

const metrics = [
  {
    title: "Unique Visitors",
    value: "24.7K",
    change: "+20%",
    trend: "up", // up or down
    compare: "Vs last month",
  },
  {
    title: "Total Pageviews",
    value: "55.9K",
    change: "+4%",
    trend: "up",
    compare: "Vs last month",
  },
  {
    title: "Bounce Rate",
    value: "54%",
    change: "-1.59%",
    trend: "down",
    compare: "Vs last month",
  },
  {
    title: "Visit Duration",
    value: "2m 56s",
    change: "+7%",
    trend: "up",
    compare: "Vs last month",
  },
];

export default function MetricsGrid() {
  return (
    
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">
              {metric.title}
            </p>

            <div className="mt-3 flex items-end justify-between">
              <div>
                <h4 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                  {metric.value}
                </h4>
              </div>

              <div className="flex items-center gap-1">
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-theme-xs font-medium 
                    ${
                      metric.trend === "up"
                        ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                        : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"
                    }`}
                >
                  {metric.change}
                </span>

                <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                  {metric.compare}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    
  );
}
