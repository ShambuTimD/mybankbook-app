//import React, { useState, useEffect } from "react";
import { Head, usePage } from "@inertiajs/react";
import Header from "@/Pages/BrandSelfAppointment/Header";
import Footer from "@/Pages/BrandSelfAppointment/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPrint, faDownload } from "@fortawesome/free-solid-svg-icons";
import React, { useEffect, useState } from "react";

const ThankYouPage = () => {
    const { settings } = usePage().props;

    const [refNo, setRefNo] = useState("");
    const [form, setForm] = useState(null);
    const [companyData, setCompanyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dos, setDos] = useState(null);
    const [applicantId, setApplicantId] = useState(null);
    const [firstName, setFirstName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [excelUrl, setExcelUrl] = useState("");
    const [appointmentDateText, setAppointmentDateText] = useState("");
    const [bookingStatus, setBookingStatus] = useState("");







    useEffect(() => {
        const formData = sessionStorage.getItem("korpheal_booking_data");
        const companyInfo = sessionStorage.getItem("korpheal_company_data");
        const selectedOfficeName = sessionStorage.getItem("korpheal_selected_office_name");
        const qs = new URLSearchParams(window.location.search);
        const bookingRef = qs.get("brn") || qs.get("refno");
        const timestamp = qs.get("dos");

        const storedBookingStatus = sessionStorage.getItem("booking_status");
        if (storedBookingStatus) setBookingStatus(storedBookingStatus);

        if (formData && companyInfo && bookingRef) {
            const parsedForm = JSON.parse(formData);
            const parsedCompany = JSON.parse(companyInfo);
            setForm(parsedForm);
            const displayCenter = selectedOfficeName || parsedForm?.office_location || "";
            setCompanyData({ ...parsedCompany, display_center: displayCenter });
            setRefNo(bookingRef);
            setDos(timestamp ? Number(timestamp) : null);
        }

        const storedApptDate = sessionStorage.getItem("appointment_date");
        if (storedApptDate) {
            setAppointmentDateText(storedApptDate.replace(/-/g, "/")); // dd/MM/yyyy
        }

        const storedApplicantId = sessionStorage.getItem("applicant_id");
        if (storedApplicantId) setApplicantId(storedApplicantId);

        const sessionUser = sessionStorage.getItem("session_user");
        if (sessionUser) {
            const userData = JSON.parse(sessionUser);
            setFirstName(userData.first_name || "");
            setPhoneNumber(userData.phone_number || "");
        }

        const storedExcel = sessionStorage.getItem("excel_download_url");
        if (storedExcel) setExcelUrl(storedExcel);

        setLoading(false);

        // 🔴 Cleanup when leaving page
        return () => {
            
            sessionStorage.clear();
        };
    }, []);

    const handlePrintModal = () => window.print();

    const handleDownloadExcel = () => {
        if (!excelUrl) return;
        window.open(excelUrl, "_blank", "noopener,noreferrer");
    };

    if (loading || !form || !companyData) {
        return <div className="text-center mt-20 text-xl">No data available</div>;
    }

    const totalDependents = form.employees.reduce(
        (acc, emp) => acc + emp.dependents.length,
        0
    );

    const readableDos =
        dos && !isNaN(dos)
            ? new Date(dos * 1000).toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            })
            : new Date().toLocaleString();

    return (
        <>
            <Head>
                <title>Thank You</title>
                <link
                    rel="icon"
                    type="image/png"
                    href={settings.app_settings.application_favicon}
                />
            </Head>

            <Header
                authenticated={true}
                settings={settings}
                companyData={companyData}
                currentStep={3}
            />

            <div className="px-6 md:px-8 py-5 text-gray-800">
                <div className="max-w-4xl mx-auto space-y-16">
                    {/* Heading */}
                    <div className="text-center">
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
                    <div id="thankyou-print" className="book_success ">
                        <div className="text-center ">
                            <h1 className="text-5xl font-semibold th_hading text-green-700 mb-4">
                                Booking Successful!
                            </h1>
                            <p className="text-xl text-gray-700 font-medium sub_th_hading mb-5">
                                Your booking has been confirmed. Please find the details below for
                                your reference. A support team member will contact you shortly.
                            </p>
                        </div>

                        {/* Booking Summary */}
                        <div className="bg-white bg_shadow all_btn th_deta rounded-xl p-8 space-y-5 text-lg leading-relaxed">
                            <div className="space-y-4">
                                {refNo && (
                                    <p>
                                        <strong>Booking Reference No:</strong> {refNo}
                                    </p>
                                )}

                                <p>
                                    <strong>Booking Status:</strong>{" "}
                                    <span className="text-green-600 font-semibold">
                                        Success
                                        {bookingStatus
                                            ? `-${bookingStatus.charAt(0).toUpperCase() + bookingStatus.slice(1)}`
                                            : ""}
                                    </span>
                                </p>

                                {appointmentDateText && (
                                    <p>
                                        <strong>Appointment Request Date:</strong> {appointmentDateText}
                                    </p>
                                )}

                                {companyData?.company_name && (
                                    <p>
                                        <strong>Company:</strong> {companyData.company_name}
                                    </p>
                                )}

                                {form?.office_location && (
                                    <p>
                                        <strong>Office/Center/Unit:</strong> {form.office_location}
                                    </p>
                                )}

                                {(form?.employees?.length || totalDependents) > 0 && (
                                    <p>
                                        <strong>Total Applicants:</strong>{" "}
                                        {form.employees.length + totalDependents} (Employees:{" "}
                                        {form.employees.length}, Dependents: {totalDependents})
                                    </p>
                                )}

                                {(firstName || phoneNumber || companyData?.hr_details?.email) && (
                                    <p>
                                        <strong>Submitted By:</strong>{" "}
                                        {firstName || ""}
                                        {phoneNumber ? ` | +91${phoneNumber}` : ""}
                                        {companyData?.hr_details?.email
                                            ? ` | ${companyData.hr_details.email}`
                                            : ""}
                                    </p>
                                )}

                                {dos && !isNaN(dos) && (
                                    <p>
                                        <strong>Submission Date:</strong> {readableDos}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="all_btn th_deta rounded-xl prind_download text-lg leading-relaxed">
                        {/* Action Buttons */}
                        <div className="flex flex-wrap justify-center gap-6 mt-10">
                            <button
                                onClick={handlePrintModal}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-3 rounded-md font-semibold"
                            >
                                <FontAwesomeIcon icon={faPrint} /> Print Receipt
                            </button>

                            {excelUrl && (
                                <button
                                    onClick={handleDownloadExcel}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-8 py-3 rounded-md font-semibold"
                                >
                                    <FontAwesomeIcon icon={faDownload} /> Download as CSV
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Footer companyName={settings.app_settings.company_name} />
        </>
    );
};

export default ThankYouPage;
