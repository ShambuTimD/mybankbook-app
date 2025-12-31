import MonthlyTarget from "@/Pages/BrandSelfAppointment/FrontendUserDashboard/UiSections/MonthlyTarget";
import RecentOrders from "./UiSections/RecentOrders";
import PageMeta from "@/Components/common/PageMeta";
import { Head } from "@inertiajs/react";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

// =========================================================================
// 🔥 ANIMATED NUMBER COMPONENT
// =========================================================================
const AnimatedNumber = ({ value, duration = 800, decimalPlaces = 0 }) => {
    const [currentValue, setCurrentValue] = useState(0);
    const prevValueRef = useRef(0);
    const startTimeRef = useRef(null);
    const requestRef = useRef(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        const startValue = prevValueRef.current;
        const endValue = value || 0;
        const range = endValue - startValue;

        if (range === 0) {
            setCurrentValue(endValue);
            return;
        }

        startTimeRef.current = performance.now();

        const animate = (currentTime) => {
            if (!isMounted.current) return;

            const elapsed = currentTime - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const nextValue = startValue + range * easeOut;

            setCurrentValue(nextValue);

            if (progress < 1) {
                requestRef.current = requestAnimationFrame(animate);
            } else {
                prevValueRef.current = endValue;
            }
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            isMounted.current = false;
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [value, duration]);

    const formattedValue = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
    }).format(currentValue);

    return <>{formattedValue}</>;
};

// =========================================================================
// 🌀 SPINNER COMPONENT
// =========================================================================
const Spinner = ({ colorClass }) => (
    <svg
        className={`animate-spin h-12 w-12 ${colorClass}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
    >
        <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
        ></circle>
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
    </svg>
);

// =========================================================================
// 🔥 THEMED METRIC CARD
// =========================================================================
const ThemedMetricCard = ({
    title,
    description,
    children,
    theme = "default",
    loading = false,
}) => {
    let bgColorClass = "bg-white dark:bg-gray-800";
    let accentBorderColorClass = "border-blue-500";
    let borderColorClass = "border-gray-200 dark:border-gray-700";
    let titleColorClass = "text-gray-900 dark:text-white";
    let descriptionColorClass = "text-gray-600 dark:text-gray-400";
    let primaryMetricColorClass = "text-blue-600 dark:text-blue-400";
    let subMetricColorClass = "text-gray-900 dark:text-white";

    switch (theme) {
        case "purple":
            bgColorClass = "bg-purple-50 dark:bg-gray-900";
            accentBorderColorClass = "border-purple-600 dark:border-purple-500";
            borderColorClass = "border-purple-200 dark:border-purple-800";
            primaryMetricColorClass = "text-purple-700 dark:text-purple-400";
            titleColorClass = "text-purple-800 dark:text-purple-100";
            descriptionColorClass = "text-purple-600 dark:text-purple-300";
            subMetricColorClass = "text-purple-700 dark:text-purple-200";
            break;
        case "green":
            bgColorClass = "bg-green-50 dark:bg-gray-900";
            accentBorderColorClass = "border-green-600 dark:border-green-500";
            borderColorClass = "border-green-200 dark:border-green-800";
            primaryMetricColorClass = "text-green-700 dark:text-green-400";
            titleColorClass = "text-green-800 dark:text-green-100";
            descriptionColorClass = "text-green-600 dark:text-green-300";
            subMetricColorClass = "text-green-700 dark:text-green-200";
            break;
        case "yellow":
            bgColorClass = "bg-yellow-50 dark:bg-gray-900";
            accentBorderColorClass = "border-yellow-600 dark:border-yellow-500";
            borderColorClass = "border-yellow-200 dark:border-yellow-800";
            primaryMetricColorClass = "text-yellow-700 dark:text-yellow-400";
            titleColorClass = "text-yellow-800 dark:text-yellow-100";
            descriptionColorClass = "text-yellow-600 dark:text-yellow-300";
            subMetricColorClass = "text-yellow-700 dark:text-yellow-200";
            break;
        case "blue":
            bgColorClass = "bg-blue-50 dark:bg-gray-900";
            accentBorderColorClass = "border-blue-600 dark:border-blue-500";
            borderColorClass = "border-blue-200 dark:border-blue-800";
            primaryMetricColorClass = "text-blue-700 dark:text-blue-400";
            titleColorClass = "text-blue-800 dark:text-blue-100";
            descriptionColorClass = "text-blue-600 dark:text-blue-300";
            subMetricColorClass = "text-blue-700 dark:text-blue-200";
            break;
        default:
            break;
    }

    return (
        <div
            className={`
                ${bgColorClass} rounded-xl flex flex-col 
                min-h-[16rem] border border-l-8 ${borderColorClass} ${accentBorderColorClass}
                px-5 py-4 shadow-sm hover:shadow-2xl hover:bg-white dark:hover:bg-gray-800
                transform transition-all duration-300 ease-in-out hover:-translate-y-2 hover:scale-[1.02] cursor-pointer
            `}
        >
            {/* ✅ LOGIC CHANGE: If loading, show spinner in center. Else, show content. */}
            {loading ? (
                <div className="flex-grow flex justify-center items-center">
                    <Spinner colorClass={primaryMetricColorClass} />
                </div>
            ) : (
                <div className="flex-grow flex flex-col">
                    <h2 className={`text-2xl font-normal ${titleColorClass} mb-2`}>{title}</h2>
                    <p className={`text-base ${descriptionColorClass} leading-5 mb-5`}>{description}</p>
                    
                    <div className="flex-grow flex flex-col justify-end">
                        {children(primaryMetricColorClass, subMetricColorClass)}
                    </div>
                </div>
            )}
        </div>
    );
};

const MetricCard = ({ title, description, children, theme, loading }) => (
    <ThemedMetricCard title={title} description={description} theme={theme} loading={loading}>
        {(primaryColorClass, subMetricColorClass) => (
            <>{children(primaryColorClass, subMetricColorClass)}</>
        )}
    </ThemedMetricCard>
);

// =========================================================================
// 🔥 MAIN HOME COMPONENT
// =========================================================================
export default function Home() {
    const [applicantUserSegment, setApplicantUserSegment] = useState({});
    const [applicantStatus, setApplicantStatus] = useState({});
    const [reportStatus, setReportStatus] = useState({});
    const [dashboardMetrics, setDashboardMetrics] = useState({});
    const [dashboardData, setDashboardData] = useState({});
    
    const [selectedOfficeId, setSelectedOfficeId] = useState(
        sessionStorage.getItem("selected_office_id") || "all"
    );
    const [filter, setFilter] = useState("month");
    const [loading, setLoading] = useState(false);

    const [fyStartDate, setFyStartDate] = useState("");
    const [fyEndDate, setFyEndDate] = useState("");

    const userData = JSON.parse(sessionStorage.getItem("session_user") || "{}");
    const selectedFy = sessionStorage.getItem("selected_financial_year") || "";

    const token = userData?.token;

    const axiosConfig = {
        headers: { Authorization: `Bearer ${token || ""}` },
        withCredentials: true,
    };

    // 1. Fetch Settings
    useEffect(() => {
        const fetchDashboardSettings = async () => {
            try {
                const response = await axios.get(route("dashboard.settings"), axiosConfig);

                console.log("Dashboard Settings Response:", response.data.data);

                setApplicantStatus(response.data?.data?.applicant_status || {});
                setApplicantUserSegment(response.data?.data?.applicant_segment || {});
                setReportStatus(response.data?.data?.report_status || {});
                setDashboardMetrics(response.data?.data?.dashboard_metrics || {});
            } catch (error) {
                console.error("Error loading settings", error);
            }
        };
        fetchDashboardSettings();
    }, []);

    // 2. Fetch Metrics
    const fetchDashboardMetrics = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(route("dashboard.metrics"), {
                ...axiosConfig,
                params: {
                    office_id: selectedOfficeId !== "all" ? selectedOfficeId : null,
                    range: filter,
                    filter: selectedFy,
                },
            });

            const d = response.data?.data || {};
            console.log("Dashboard Metrics Data:", d);

            setDashboardData({
                employees_count: Number(d?.applicant_user_segment?.total_employees ?? 0),
                dependents_count: Number(d?.applicant_user_segment?.total_dependents ?? 0),
                total_enrolled: Number(d?.applicant_user_segment?.total_enrolled ?? 0),
                scheduled_count: Number(d?.application_status?.scheduled_application ?? 0),
                attended_count: Number(d?.application_status?.attended_application ?? 0),
                no_show_count: Number(d?.application_status?.no_show_application ?? 0),
                cancelled_hold_count: Number(d?.application_status?.cancelled_application ?? 0),
                total_applications: Number(d?.application_status?.total_application ?? 0),
                total_reports: Number(d?.report_status?.total_report ?? 0),
                reports_processing: Number(d?.report_status?.processing_report ?? 0),
                reports_in_qc: Number(d?.report_status?.in_qc_report ?? 0),
                reports_shared: Number(d?.report_status?.shared_report ?? 0),
                attendance_rate: Number(d?.overview?.attendance_rate ?? 0),
                program_title: "Program",
            });
        } catch (error) {
            console.error("Error fetching metrics:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedOfficeId, filter, selectedFy]);

    useEffect(() => { fetchDashboardMetrics(); }, [fetchDashboardMetrics]);

    useEffect(() => {
        const handleOfficeChange = () => {
            const id = sessionStorage.getItem("selected_office_id") || "all";
            setSelectedOfficeId(id);
            fetchDashboardMetrics();
        };

        window.addEventListener("office_changed", handleOfficeChange);
        return () => window.removeEventListener("office_changed", handleOfficeChange);
    }, []);

    useEffect(() => {
        const handleFYChange = () => {
            const fy = sessionStorage.getItem("selected_financial_year");
            if (fy && fy.includes("-")) {
                const [startYear, endYear] = fy.split("-");
                setFyStartDate(`${startYear}-04-01`);
                setFyEndDate(`${endYear}-03-31`);
            } else {
                setFyStartDate("");
                setFyEndDate("");
            }
        };
        window.addEventListener("financial_year_changed", handleFYChange);
        handleFYChange();
        return () => window.removeEventListener("financial_year_changed", handleFYChange);
    }, []);

    // ---------------------------------------------------------------------
    // 🔥 INFO COMPONENT
    // ---------------------------------------------------------------------
    const Info = ({ text, align = "center" }) => {
        let positionClasses = "left-1/2 -translate-x-1/2";
        let arrowClasses = "left-1/2 -translate-x-1/2";

        if (align === "left") {
            positionClasses = "left-0 translate-x-0";
            arrowClasses = "left-1.5";
        } else if (align === "right") {
            positionClasses = "right-0 translate-x-0";
            arrowClasses = "right-1.5";
        }

        return (
            <div className="relative group cursor-pointer inline-flex items-center">
                <FontAwesomeIcon
                    icon={faInfoCircle}
                    className="text-gray-400 text-[14px] group-hover:text-current transition-colors"
                />
                <div
                    className={`
                        absolute top-full mt-2 ${positionClasses} 
                        hidden group-hover:block
                        bg-black text-white text-[12px] px-3 py-2 rounded-md shadow-lg
                        w-max max-w-[200px] whitespace-normal z-50 leading-relaxed
                    `}
                >
                    {text}
                    <div className={`absolute bottom-full w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[4px] border-b-black ${arrowClasses}`}></div>
                </div>
            </div>
        );
    };

    return (
        <>
            <Head title="Dashboard" />
            <PageMeta title="Dashboard | Brand Self Appointment" description="Dashboard" />

            <div className="w-full space-y-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">

                    {/* 1️⃣ User Segments */}
                    <MetricCard loading={loading} title="Applicants by User Segments" description="Total number of users enrolled under the health program." theme="purple">
                        {(primary, sub) => (
                            <div className="flex items-center gap-1 justify-between pt-2 pb-2 whitespace-nowrap w-full">
                                <div className="flex flex-col text-lg font-medium leading-tight text-gray-700 dark:text-gray-300 min-w-[110px]">
                                    <div className="flex items-center gap-1">
                                        <span className="font-normal">Employees</span>
                                        <Info text={applicantUserSegment.app_segement_emp} align="left" />
                                    </div>
                                    <span className={`text-4xl font-normal ${primary}`}><AnimatedNumber value={dashboardData.employees_count} /></span>
                                </div>
                                <div className="flex flex-col text-lg font-medium leading-tight text-gray-700 dark:text-gray-300 min-w-[110px]">
                                    <div className="flex items-center gap-1">
                                        <span className="font-normal">Dependents</span>
                                        <Info text={applicantUserSegment.app_segement_dep} align="center" />
                                    </div>
                                    <span className={`text-4xl font-normal ${primary}`}><AnimatedNumber value={dashboardData.dependents_count} /></span>
                                </div>
                                <div className="flex flex-col text-lg font-medium leading-tight text-gray-700 dark:text-gray-300 min-w-[130px]">
                                    <div className="flex items-center gap-1">
                                        <span className="font-normal">Total Enrolled</span>
                                        <Info text={applicantUserSegment.app_segement_total_enrolled} align="right" />
                                    </div>
                                    <span className={`text-4xl font-normal ${primary}`}><AnimatedNumber value={dashboardData.total_enrolled ?? (dashboardData.employees_count + dashboardData.dependents_count)} /></span>
                                </div>
                            </div>
                        )}
                    </MetricCard>

                    {/* 2️⃣ Applications Status */}
                    <MetricCard loading={loading} title="Applications by Status" description={`Live status of applications in ${dashboardData.program_title}.`} theme="green">
                        {(primary, sub) => (
                            <>
                                <div className="flex flex-col text-lg font-medium leading-tight text-gray-700 dark:text-gray-300 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                                    <div className="flex items-center gap-1">
                                        <span className={`font-normal ${sub}`}>Total Applications</span>
                                        <Info text={applicantStatus.app_status_total_applications} align="left" />
                                    </div>
                                    <span className={`text-5xl font-normal ${primary} mt-1`}><AnimatedNumber value={dashboardData.total_applications} /></span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-4 w-full">
                                    <div className="flex flex-col text-lg font-medium leading-tight text-gray-700 dark:text-gray-300">
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">Scheduled</span>
                                            <Info text={applicantStatus.app_status_schedule} align="left" />
                                        </div>
                                        <span className={`text-2xl font-normal ${sub}`}><AnimatedNumber value={dashboardData.scheduled_count} /></span>
                                    </div>
                                    <div className="flex flex-col text-lg font-medium leading-tight text-gray-700 dark:text-gray-300">
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">Attended</span>
                                            <Info text={applicantStatus.app_status_attended} align="right" />
                                        </div>
                                        <span className={`text-2xl font-normal ${sub}`}><AnimatedNumber value={dashboardData.attended_count} /></span>
                                    </div>
                                    <div className="flex flex-col text-lg font-medium leading-tight text-gray-700 dark:text-gray-300">
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">No Show</span>
                                            <Info text={applicantStatus.app_status_no_show} align="left" />
                                        </div>
                                        <span className={`text-2xl font-normal ${sub}`}><AnimatedNumber value={dashboardData.no_show_count} /></span>
                                    </div>
                                    <div className="flex flex-col text-lg font-medium leading-tight text-gray-700 dark:text-gray-300 min-w-[130px]">
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">Cancelled</span>
                                            <Info text={applicantStatus.app_status_cancelled} align="right" />
                                        </div>
                                        <span className={`text-2xl font-normal ${sub}`}><AnimatedNumber value={dashboardData.cancelled_hold_count} /></span>
                                    </div>
                                </div>
                            </>
                        )}
                    </MetricCard>

                    {/* 3️⃣ Reports Status */}
                    <MetricCard loading={loading} title="Reports by Status" description={`Report progress for all attended applicants.`} theme="yellow">
                        {(primary, sub) => (
                            <>
                                <div className="flex flex-col text-lg font-medium leading-tight text-gray-700 dark:text-gray-300 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                                    <div className="flex items-center gap-1">
                                        <span className={`font-normal ${sub}`}>Total Reports</span>
                                        <Info text={reportStatus.app_report_total_reports} align="left" />
                                    </div>
                                    <span className={`text-5xl font-normal ${primary} mt-1`}><AnimatedNumber value={dashboardData.total_reports} /></span>
                                </div>
                                <div className="flex items-center gap-1 justify-between pt-2 pb-2 w-full">
                                    <div className="flex flex-col text-lg font-medium leading-tight text-gray-700 dark:text-gray-300">
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">Processing</span>
                                            <Info text={reportStatus.app_report_processing} align="left" />
                                        </div>
                                        <span className={`text-2xl font-normal ${sub}`}><AnimatedNumber value={dashboardData.reports_processing} /></span>
                                    </div>
                                    <div className="flex flex-col text-lg font-medium leading-tight text-gray-700 dark:text-gray-300">
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">In QC</span>
                                            <Info text={reportStatus.app_report_in_qc} align="center" />
                                        </div>
                                        <span className={`text-2xl font-normal ${sub}`}><AnimatedNumber value={dashboardData.reports_in_qc} /></span>
                                    </div>
                                    <div className="flex flex-col text-lg font-medium leading-tight text-gray-700 dark:text-gray-300 min-w-[120px]">
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">Report Shared</span>
                                            <Info text={reportStatus.app_report_report_shared} align="right" />
                                        </div>
                                        <span className={`text-2xl font-normal ${sub}`}><AnimatedNumber value={dashboardData.reports_shared} /></span>
                                    </div>
                                </div>
                            </>
                        )}
                    </MetricCard>

                    {/* 4️⃣ Overview */}
                    <MetricCard loading={loading} title="360° Overview & Metrics" description={`High-level completion and attendance insights.`} theme="blue">
                        {(primary, sub) => (
                            <>
                                <div className="flex flex-col text-lg font-medium leading-tight text-gray-700 dark:text-gray-300 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                                    <div className="flex items-center gap-1">
                                        <span className={`font-normal ${sub}`}>Attendance Rate</span>
                                        <Info text={dashboardMetrics.dashboard_metrics_attendance_rate} align="left" />
                                    </div>
                                    <span className={`text-6xl font-normal ${primary} mt-1`}><AnimatedNumber value={dashboardData.attendance_rate} decimalPlaces={1} />%</span>
                                </div>
                                <div className="flex items-center gap-1 justify-between pt-2 w-full">
                                    <div className="flex flex-col text-lg font-medium leading-tight text-gray-700 dark:text-gray-300">
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">Total Enrolled</span>
                                            <Info text={dashboardMetrics.dashboard_metrics_total_enrolled} align="left" />
                                        </div>
                                        <span className={`text-2xl font-normal ${sub}`}><AnimatedNumber value={dashboardData.total_enrolled ?? (dashboardData.employees_count + dashboardData.dependents_count)} /></span>
                                    </div>
                                    <div className="flex flex-col text-lg font-medium leading-tight text-gray-700 dark:text-gray-300">
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">Total Attended</span>
                                            <Info text={dashboardMetrics.dashboard_metrics_total_attended} align="center" />
                                        </div>
                                        <span className={`text-2xl font-normal ${sub}`}><AnimatedNumber value={dashboardData.attended_count} /></span>
                                    </div>
                                    <div className="flex flex-col text-lg font-medium leading-tight text-gray-700 dark:text-gray-300">
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">Dropped</span>
                                            <Info text={dashboardMetrics.dashboard_metrics_total_dropped} align="right" />
                                        </div>
                                        <span className={`text-2xl font-normal ${sub}`}><AnimatedNumber value={(dashboardData.no_show_count || 0) + (dashboardData.cancelled_hold_count || 0)} /></span>
                                    </div>
                                </div>
                            </>
                        )}
                    </MetricCard>
                </div>
            </div>

            <div className="mt-8">
                <RecentOrders officeId={selectedOfficeId} startDate={fyStartDate} endDate={fyEndDate} />
            </div>
        </>
    );
}