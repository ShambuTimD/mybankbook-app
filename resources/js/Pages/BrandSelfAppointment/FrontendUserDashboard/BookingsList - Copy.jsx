import React, { useRef, useState, useEffect } from "react";
import Metricsgrid from "@/Components/analytics/Metricsgrid";
import ComponentCard from "@/Components/common/ComponentCard";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import axios from "axios";

DataTable.use(DT);

const BookingsList = () => {
    const userData = JSON.parse(sessionStorage.getItem("session_user") || "{}");
    const token = userData?.token;

    const axiosConfig = {
        headers: { Authorization: `Bearer ${token || ""}` },
        withCredentials: true,
    };

    const [bookingCardData, setBookingCardData] = useState([]);
    // console.log("Booking Card Data:", bookingCardData);
    const [bookingData, setBookingData] = useState([]);

    // STATUS FILTER + REF
    const [status, setStatus] = useState("all");
    const statusOptions = ["pending", "confirmed", "cancelled", "completed"];
    const tableRef = useRef(null);

    let isApi = true;

    useEffect(() => {
        const fetchBookingMetrics = async () => {
            try {
                // Now fetch your dashboard metrics
                const response = await axios.get(route("frontbooking.metrics"), {
                    ...axiosConfig,
                    headers: {
                        ...axiosConfig.headers,
                        "Content-Type": "multipart/form-data",
                    },
                });

                // console.log("API Response:", response);

                setBookingCardData(response.data.data);
            } catch (error) {
                console.error("Error fetching booking metrics:", error);
            }
        };

        if (isApi === true) {
            fetchBookingMetrics();
            isApi = false;
        }
    }, []);

    //Booking metrics API call can be integrated here
    const metrics = [
        {
            title: "Upcoming Bookings",
            value: bookingCardData.upcoming_bookings,
            // change: "+20%",
            // trend: "up", // up or down
            // compare: "Vs last month",
        },
        {
            title: "Completed Bookings",
            value: bookingCardData.completed_bookings,
            // change: "+4%",
            // trend: "up",
            // compare: "Vs last month",
        },
        {
            title: "Cancelled Bookings",
            value: bookingCardData.cancelled_bookings,
            // change: "-1.59%",
            // trend: "down",
            // compare: "Vs last month",
        },
        {
            title: "No-Shows",
            value: bookingCardData.no_shows,
            // change: "+7%",
            // trend: "up",
            // compare: "Vs last month",
        },
    ];

    // Reload (still keep this) – but we’ll also key the table to be bulletproof
    useEffect(() => {
        const api = tableRef.current?.dt?.();
        if (api) api.ajax.reload(null, true);
    }, [status]);

    // --- Demo Data (new structure) ---
    const demoBookings = [
        {
            booking_id: "BKG001",
            employee_name: "Rahul Sharma",
            service_type: "Full Body Checkup",
            office: "Kolkata HQ",
            datetime: "2025-10-01 10:00",
            status: "pending",
            submitted_by: "Admin User",
        },
        {
            booking_id: "BKG002",
            employee_name: "Ananya Roy",
            service_type: "Dental Checkup",
            office: "Delhi Office",
            datetime: "2025-10-03 11:30",
            status: "confirmed",
            submitted_by: "HR Manager",
        },
        {
            booking_id: "BKG003",
            employee_name: "Suresh Kumar",
            service_type: "Eye Checkup",
            office: "Mumbai Branch",
            datetime: "2025-10-05 14:00",
            status: "completed",
            submitted_by: "Company Executive",
        },
    ];

    // --- Column Definitions ---
    const columns = [
        { data: "id", title: "Sys Id", orderable: true, searchable: false },
        { data: "brn", title: "BRN" },
        { data: "company", title: "Company" },
        { data: "office", title: "Office" },
        {
            data: "pref_appointment_date",
            title: "Preferred Date",
            render: (data) => (data ? moment(data).format("DD-MM-YYYY") : "-"),
        },
        {
            data: "preferred_collection_mode",
            title: "Preferred Collection Mode",
        },
        {
            data: "booking_status",
            title: "Status",
            render: (v) => {
                const map = {
                    pending: "bg-yellow-100 text-yellow-700",
                    confirmed: "bg-blue-100 text-blue-700",
                    completed: "bg-green-100 text-green-700",
                    cancelled: "bg-red-100 text-red-700",
                };
                const cls =
                    map[(v || "").toLowerCase()] || "bg-gray-100 text-gray-700";
                const label = v ? v.charAt(0).toUpperCase() + v.slice(1) : "";
                return `<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${cls}">${label}</span>`;
            },
        },
        { data: "notes", title: "Notes" },
        {
            data: null,
            title: "Total Applicants",
            render: (row) =>
                (parseInt(row?.total_employees || 0, 10) || 0) +
                (parseInt(row?.total_dependents || 0, 10) || 0),
        },
        {
            data: "created_on",
            title: "Created On",
            render: (data) => moment(data).format("DD-MM-YYYY HH:mm"),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Top Metrics */}
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

            {/* Booking DataTable */}
            <ComponentCard>
                <h2 className="text-lg font-semibold mb-4">Booking List</h2>

                {/* Filter Row */}
                <div className="mb-4 flex items-center gap-3" style={{marginBottom: "15px"}}>
                    <label className="text-sm font-medium">
                        Filter by Status:
                    </label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="h-9 min-w-[200px] rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">All</option>
                        {statusOptions.map((s) => (
                            <option key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                <DataTable
                    key={status} // <- force rebuild when filter changes
                    ref={tableRef}
                    ajax={{
                        url: route("frontbooking.index"),
                        type: "GET",
                        data: (d) => {
                            // IMPORTANT: return merged payload so DataTables actually sends it
                            return {
                                ...d,
                                booking_status: status === "all" ? "" : status,
                            };
                        },
                        dataSrc: "data",
                    }}
                    columns={columns}
                    className="display nowrap w-100"
                    options={{
                        paging: true,
                        searching: true,
                        ordering: true,
                        responsive: true,
                        pageLength: 10, // default rows per page
                        lengthMenu: [10, 25, 50, 100],
                    }}
                />
            </ComponentCard>
        </div>
    );
};

export default BookingsList;
