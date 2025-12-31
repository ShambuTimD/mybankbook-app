import React, { useEffect, useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import axios from "axios";
import { route } from "ziggy-js";
import Header from "@/Pages/BrandSelfAppointment/Header";
import Footer from "@/Pages/BrandSelfAppointment/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPrint, faDownload, faPlusCircle } from "@fortawesome/free-solid-svg-icons";

const ThankYouPage = () => {
    const [settings, setSettings] = useState({});
    // console.log("Settings:", settings)

    const [summary, setSummary] = useState(null);

    const [loading, setLoading] = useState(true);
    const [excelUrl, setExcelUrl] = useState("");
    const [companyData, setCompanyData] = useState(null);
    const [authenticated, setAuthenticated] = useState(false);

    // --- helpers
    const toDdMonYyyy = (isoOrDateStr) => {
        if (!isoOrDateStr) return "";
        try {
            const dt = new Date(isoOrDateStr);
            if (isNaN(dt.getTime())) return isoOrDateStr;
            return dt
                .toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                })
                .replace(",", "");
        } catch {
            return isoOrDateStr;
        }
    };

    const toReadableDateTime = (isoOrDateStr) => {
        if (!isoOrDateStr) return "";
        try {
            const dt = new Date(isoOrDateStr);
            if (isNaN(dt.getTime())) return isoOrDateStr;
            return dt
                .toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                })
                .replace(",", "");
        } catch {
            return isoOrDateStr;
        }
    };

    const humanize = (s = "") =>
        String(s)
            .replace(/[_-]+/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());

    useEffect(() => {
        const userSession = sessionStorage.getItem("session_email");
        setAuthenticated(!!userSession);

        // 1. Try loading from Session Storage FIRST (Fallback for empty URL params)
        const sessionSummaryRaw = sessionStorage.getItem("korpheal_last_summary");
        const sessionExcel = sessionStorage.getItem("excel_download_url");
        
        if (sessionSummaryRaw) {
            try {
                const parsedSummary = JSON.parse(sessionSummaryRaw);
                setSummary(parsedSummary);
                
                // If we have an ID in session, set excel URL immediately
                if (parsedSummary.booking_id) {
                    setExcelUrl(
                        route("frontbooking.export", parsedSummary.booking_id)
                    );
                } else if (sessionExcel) {
                    setExcelUrl(sessionExcel);
                }
                setLoading(false); // We have data, stop loading
            } catch (e) {
                console.error("Error parsing session summary", e);
            }
        }

        // 2. Fetch brn from URL
        const searchParams = new URLSearchParams(window.location.search);
        const bookingRef = searchParams.get("brn");

        // 3. Restore header info from session
        const companyRaw = sessionStorage.getItem("korpheal_company_data");
        if (companyRaw) {
            try {
                const parsedCompany = JSON.parse(companyRaw);
                const officeFromSession = sessionStorage.getItem("korpheal_selected_office_name");
                
                // Use summary office if available, otherwise session office
                let displayCenter = officeFromSession || "";
                if (summary && summary.office) {
                    displayCenter = summary.office;
                }

                setCompanyData({
                    ...parsedCompany,
                    display_center: displayCenter,
                });
            } catch {}
        }

        // 4. If URL has BRN, fetch fresh data from API (Source of Truth)
        if (bookingRef) {
            setLoading(true); // Ensure loading is on while fetching
            axios
                .post(route("frontbooking.public.brn.summary"), { brn: bookingRef })
                .then((res) => {
                    if (res.data?.success) {
                        const serverSummary = res.data.data;
                        setSummary(serverSummary);

                        if (serverSummary.booking_id) {
                            setExcelUrl(
                                route(
                                    "frontbooking.export",
                                    serverSummary.booking_id
                                )
                            );
                        }
                    }
                })
                .catch((err) => {
                    console.error("Error fetching booking summary:", err);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            // If NO bookingRef and NO session data, then stop loading (shows No Data)
            if (!sessionSummaryRaw) {
                setLoading(false);
            }
        }
    }, []);

    // Fetch booking offset from API
    useEffect(() => {
        axios
            .get(route("frontend.settings"))
            .then((res) => {
                // console.log("✅ API Response:", res.data); // log full response
                const setting = res.data.data.settings;
                setSettings(setting || {});
            })
            .catch((err) => {
                console.error("❌ Error fetching settings:", err);
            });
    }, []);

    const handlePrintModal = () => window.print();

    // ✅ Handle Create New Booking Logic
    const handleNewBooking = () => {
        // 1. Clear OLD booking specific data
        sessionStorage.removeItem("korpheal_booking_data"); 
        sessionStorage.removeItem("korpheal_last_summary");
        sessionStorage.removeItem("booking_ref");
        sessionStorage.removeItem("booking_status");
        sessionStorage.removeItem("request_date");
        sessionStorage.removeItem("excel_download_url");
        sessionStorage.removeItem("applicant_id");
        sessionStorage.removeItem("client_session_id");

        // 2. Set flag for main page to resume at Step 2
        sessionStorage.setItem("korpheal_resume_step", "choose-mode");

        // 3. Redirect to main booking page
        window.location.assign(route("brandselfappointment.index")); 
    };

    if (loading) {
        return <div className="text-center mt-20 text-xl">Loading…</div>;
    }

    if (!summary) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
                <div className="text-2xl font-bold text-gray-700 mb-4">No data available</div>
                <p className="text-gray-500 mb-6">We couldn't find the booking details. It may have expired or the link is invalid.</p>
                <button onClick={handleNewBooking} className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700">
                    Go Back to Home
                </button>
            </div>
        );
    }

    const submissionDisplay = summary.submitted_at
        ? toReadableDateTime(summary.submitted_at)
        : "";

    return (
        <>
            <Head>
                <title>Thank You</title>
                <link
                    rel="icon"
                    type="image/png"
                    href={settings.application_favicon}
                />
            </Head>

            <Header
                authenticated={authenticated}
                settings={settings}
                companyData={companyData}
                currentStep={3}
            />

            <div className="px-6 md:px-8 py-5 text-gray-800">
                <div className="max-w-4xl mx-auto space-y-16">
                    <div id="thankyou-print" className="book_success">
                        <div className="hidden print:block mb-8 mt-6 text-center">
                            <img
                                src={settings.application_big_logo}
                                alt="Company Logo"
                                className="h-14 w-auto object-contain mx-auto"
                                title={settings.company_name}
                            />
                        </div>

                        <div className="text-center print:hidden">
                            <div className="text-green-600 text-2xl smoth_faild">
                                <div
                                    className="swal2-icon swal2-success swal2-animate-success-icon smoth_faild_1"
                                    style={{ display: "flex" }}
                                >
                                    <div className="swal2-success-circular-line-left"></div>
                                    <span className="swal2-success-line-tip"></span>
                                    <span className="swal2-success-line-long"></span>
                                    <div className="swal2-success-ring"></div>
                                    <div className="swal2-success-fix"></div>
                                    <div className="swal2-success-circular-line-right"></div>
                                </div>
                            </div>
                        </div>
                        <div className="text-center">
                            <h1 className="text-5xl font-semibold th_hading text-green-700 mb-6">
                                Booking Successful!
                            </h1>
                            <p className="text-xl text-gray-700 font-medium sub_th_hading mb-5">
                                Your booking has been confirmed. Please find the
                                details below for your reference. A support team
                                member will contact you shortly.
                            </p>
                        </div>

                        <div className="bg-white bg_shadow all_btn th_deta rounded-xl p-8 space-y-5 text-lg leading-relaxed">
                            <div className="space-y-4">
                                {summary.booking_ref && (
                                    <p>
                                        <strong>Booking Reference No:</strong>{" "}
                                        {summary.booking_ref}
                                    </p>
                                )}

                                <p>
                                    <strong>Booking Status:</strong>{" "}
                                    <span className="text-green-600 font-semibold">
                                        {summary.booking_status
                                            ? `Success - ${summary.booking_status
                                                  .charAt(0)
                                                  .toUpperCase()}${summary.booking_status.slice(
                                                  1
                                              )}`
                                            : ""}
                                    </span>
                                </p>

                                {summary.request_date && (
                                    <p>
                                        <strong>
                                            Appointment Request Date:
                                        </strong>{" "}
                                        {toDdMonYyyy(summary.request_date)}
                                    </p>
                                )}

                                {summary.company && (
                                    <p>
                                        <strong>Company:</strong>{" "}
                                        {summary.company}
                                    </p>
                                )}

                                {summary.office && (
                                    <p>
                                        <strong>Office/Center/Unit:</strong>{" "}
                                        {summary.office}
                                    </p>
                                )}

                                {summary.collection_mode && (
                                    <p>
                                        <strong>
                                            Preferred Collection Type:
                                        </strong>{" "}
                                        {humanize(summary.collection_mode)}
                                    </p>
                                )}

                                {summary.applicant_summary && (
                                    <p>
                                        <strong>Total Applicants:</strong>{" "}
                                        {summary.applicant_summary}
                                    </p>
                                )}

                                {summary.submitted_by && (
                                    <p>
                                        <strong>Submitted By:</strong>{" "}
                                        {summary.submitted_by}
                                    </p>
                                )}

                                {submissionDisplay && (
                                    <p>
                                        <strong>Submission Date:</strong>{" "}
                                        {submissionDisplay}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="all_btn th_deta rounded-xl prind_download text-lg leading-relaxed">
                        <div className="flex flex-wrap justify-center gap-6 mt-10">
                            {/* 🟢 Create Booking Button */}
                            <button
                                onClick={handleNewBooking}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg px-8 py-3 rounded-md font-semibold transition duration-200"
                            >
                                <FontAwesomeIcon icon={faPlusCircle} />{" "}
                                Add New Booking
                            </button>

                            <button
                                onClick={handlePrintModal}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-3 rounded-md font-semibold"
                            >
                                <FontAwesomeIcon icon={faPrint} /> Print Receipt
                            </button>

                            {summary.booking_id && (
                                <a
                                    href={
                                        excelUrl ||
                                        route(
                                            "frontbooking.export",
                                            summary.booking_id
                                        )
                                    }
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-8 py-3 rounded-md font-semibold"
                                >
                                    <FontAwesomeIcon icon={faDownload} />{" "}
                                    Download as CSV
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Footer companyName={settings.company_name} />
        </>
    );
};

ThankYouPage.layout = null;
export default ThankYouPage;