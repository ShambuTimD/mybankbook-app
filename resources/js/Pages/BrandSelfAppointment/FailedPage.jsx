import React, { useState, useEffect } from "react";
import { Head, usePage } from "@inertiajs/react";
import Header from "@/Pages/BrandSelfAppointment/Header";
import Footer from "@/Pages/BrandSelfAppointment/Footer";

const FailedPage = () => {
  const { settings } = usePage().props;

  const [companyData, setCompanyData] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [form, setForm] = useState(null);
  const [appointmentDateText, setAppointmentDateText] = useState("");
  const [bookingStatus, setBookingStatus] = useState("Failed");
  const [excelUrl, setExcelUrl] = useState("");



  useEffect(() => {
    const userSession = sessionStorage.getItem("session_email");
    setAuthenticated(!!userSession);

    const data = sessionStorage.getItem("korpheal_company_data");
    const parsedCompany = data ? JSON.parse(data) : null;

    const sessionUser = sessionStorage.getItem("session_user");
    if (sessionUser) {
      const userData = JSON.parse(sessionUser);
      setFirstName(userData.first_name || "");
      setPhoneNumber(userData.phone_number || "");
    }

    const savedForm = sessionStorage.getItem("korpheal_booking_data");
    const parsedForm = savedForm ? JSON.parse(savedForm) : null;
    if (parsedForm) setForm(parsedForm);

    const storedApptDate = sessionStorage.getItem("appointment_date");
    const storedRequestDate = sessionStorage.getItem("request_date");
    if (storedApptDate) {
      setAppointmentDateText(storedApptDate.replace(/-/g, "/")); // dd/MM/yyyy
    } else if (storedRequestDate) {
      setAppointmentDateText(storedRequestDate.replace(/-/g, "/"));
    }
    const qs = new URLSearchParams(window.location.search);
    const statusParam = qs.get("status");
    if (statusParam) setBookingStatus(statusParam);
    // ---- Office name (single source of truth)
    const officeFromSession = sessionStorage.getItem("korpheal_selected_office_name");
    const officeFromForm = parsedForm?.office_location || "";
    const displayCenter = officeFromSession || officeFromForm || "";

    // set companyData with display_center so Header can show office name
    setCompanyData(parsedCompany ? { ...parsedCompany, display_center: displayCenter } : null);

    setSessionData({
      sid: sessionStorage.getItem("client_session_id"),
      companyName: parsedCompany?.company_name || "",
      officeName: displayCenter, // <-- use the selected office, not the first office
      user: sessionStorage.getItem("session_email") || "",
      dos: sessionStorage.getItem("submission_time") || "",
      applicantId: sessionStorage.getItem("applicant_id") || "",
    });

    // ✅ get excel download url if present
    const storedExcel = sessionStorage.getItem("excel_download_url");
    if (storedExcel) {
      setExcelUrl(storedExcel);
    } else {
      const qs = new URLSearchParams(window.location.search);
      const excelFromQS = qs.get("excel") || qs.get("excel_download_url");
      if (excelFromQS) {
        setExcelUrl(excelFromQS);
        sessionStorage.setItem("excel_download_url", excelFromQS);
      }
    }

  }, []);

  const handleGoBack = () => {
    sessionStorage.removeItem("korpheal_booking_data");
    sessionStorage.setItem("korpheal_resume_step", "choose-mode");
    window.location.href = "/brand-self-appointment?resume";
  };

  const handleDownloadData = () => {
    window.location.href = "/submitted-data-failed";
  };

  const handleDownloadExcel = () => {
    if (!excelUrl) return;
    window.open(excelUrl, "_blank", "noopener,noreferrer");
  };

  const employees = form?.employees || [];
  const totalDependents = employees.reduce(
    (sum, emp) =>
      sum + (Array.isArray(emp.dependents) ? emp.dependents.length : 0),
    0
  );

  return (
    <>
      <Head>
        <title>Booking failed</title>
        <link
          rel="icon"
          type="image/png"
          href={`${settings.app_settings.application_favicon}`}
        />
      </Head>

      <Header
        authenticated={authenticated}
        settings={settings}
        companyData={companyData}
        currentStep={3}
      />


      <div className="min-h-[80vh] flex items-center justify-center padding_faild px-6 py-14">
        <div className="bg-white shadow-xl faild_pa rounded-xl p-10 max-w-2xl w-full text-center">
          <div className="text-red-600 text-2xl mb-4 animate-shake smoth_faild ">
            <div
              className="swal2-icon swal2-error swal2-animate-error-icon smoth_faild_1"
              style={{ display: "flex" }}
            >
              <span className="swal2-x-mark">
                <span className="swal2-x-mark-line-left"></span>
                <span className="swal2-x-mark-line-right"></span>
              </span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-red-700 mb-4">
            Booking Failed
          </h1>
          <p className="text-base md:text-lg text-gray-700 mb-8">
            Something went wrong with your booking. Please find the details
            below for your reference. Please try again. A support team member
            will assist you soon.
          </p>

          {sessionData && (
            <div className="space-y-4 mb-8 text-left text-gray-800">
              {sessionData.sid && (
                <p>
                  <strong>SID:</strong> {sessionData.sid}
                </p>
              )}

              {bookingStatus && (
                <p>
                  <strong>Booking Status:</strong>{" "}
                  <span className="text-red-600 font-semibold">
                    {bookingStatus}
                  </span>
                </p>
              )}

              {appointmentDateText && (
                <p>
                  <strong>Appointment Request Date:</strong> {appointmentDateText}
                </p>
              )}

              {sessionData.companyName && (
                <p>
                  <strong>Company:</strong> {sessionData.companyName}
                </p>
              )}

              {sessionData.officeName && (
                <p>
                  <strong>Office/Center/Unit:</strong> {sessionData.officeName}
                </p>
              )}

              {(employees.length > 0 || totalDependents > 0) && (
                <p>
                  <strong>Total Applicants:</strong>{" "}
                  {employees.length + totalDependents} (Employees:{" "}
                  {employees.length}, Dependents: {totalDependents})
                </p>
              )}

              {(firstName || phoneNumber || sessionData.user) && (
                <p>
                  <strong>Submitted By:</strong>{" "}
                  {[firstName, phoneNumber ? `+91${phoneNumber}` : "", sessionData.user]
                    .filter(Boolean)
                    .join(" | ")}
                </p>
              )}

              {sessionData.dos && (
                <p>
                  <strong>Submission Date:</strong> {sessionData.dos}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <button
              onClick={handleGoBack}
              className="w-full md:w-auto px-6 py-3 bg-gray-800 text-white rounded-lg text-base font-semibold hover:bg-gray-900 transition"
            >
              Try Again
            </button>

            {excelUrl && (
              <button
                onClick={handleDownloadExcel}
                className="w-full md:w-auto px-6 py-3 bg-emerald-600 text-white rounded-lg text-base font-semibold hover:bg-emerald-700 transition"
              >
                Download Filled CSV
              </button>
            )}
          </div>
        </div>
      </div>

      <Footer companyName={settings.app_settings.company_name} />
    </>
  );
};

export default FailedPage;
