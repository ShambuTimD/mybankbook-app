import React, { useEffect, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import { Head, usePage } from "@inertiajs/react";
import Header from "./Header";
import Footer from "./Footer";

const SubmittedDataViewFailed = () => {
  const { settings } = usePage().props;
  const [form, setForm] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const pdfRef = useRef(null);

  // --- helpers ---
  const formatDate = (val) => {
    try {
      if (!val) return "";
      const d = typeof val === "string" ? new Date(val) : val;
      if (Number.isNaN(d.getTime())) return String(val);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    } catch {
      return String(val);
    }
  };

  useEffect(() => {
    try {
      // 1) Read snapshot saved at submit time
      const formStr = sessionStorage.getItem("korpheal_booking_data");
      const companyStr = sessionStorage.getItem("korpheal_company_data");

      // 2) Read client session id (sid) from session
      const clientSid = sessionStorage.getItem("client_session_id") || "";

      // 3) Read URL params (sid, brn, dos, status)
      const usp = new URLSearchParams(window.location.search);
      const sidFromUrl = usp.get("sid") || "";
      const brnFromUrl = usp.get("brn") || "";
      const dosFromUrl = usp.get("dos") || "";
      const statusFromUrl = usp.get("status") || "failed";

      // 4) Guard if nothing at all
      if (!formStr || !companyStr) {
        alert("No failed submission data found. Redirecting to previous page...");
        window.location.href = "/failed";
        return;
      }

      // 5) Parse and set state
      const parsedForm = JSON.parse(formStr);
      const parsedCompany = JSON.parse(companyStr);

      // Attach meta for display
      parsedForm.__meta = {
        sid: sidFromUrl || clientSid,
        brn: brnFromUrl,
        dos: dosFromUrl,
        status: statusFromUrl,
      };

      setForm(parsedForm);
      setCompanyData(parsedCompany);
    } catch (e) {
      console.error("Failed to rehydrate failed submission data:", e);
      alert("Could not load failed submission data.");
      window.location.href = "/failed";
    }
  }, []);

  const handleDownloadPDF = () => {
    const element = pdfRef.current;
    if (!element) return;

    const images = element.querySelectorAll("img");
    let loaded = 0;

    const maybeGenerate = () => {
      if (loaded === images.length) generatePDF();
    };

    images.forEach((img) => {
      if (img.complete) {
        loaded++;
        maybeGenerate();
      } else {
        img.onload = () => {
          loaded++;
          maybeGenerate();
        };
      }
    });

    if (images.length === 0) generatePDF();
  };

  const generatePDF = () => {
    const element = pdfRef.current;
    if (!element) return;

    const opt = {
      margin: 0.3,
      filename: `KorpHeal_Booking_FailedData.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  };

  if (!form || !companyData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-xl">
        Loading failed submission data...
      </div>
    );
  }

  const logoUrl =
    settings.app_settings.application_big_logo?.startsWith("http")
      ? settings.app_settings.application_big_logo
      : `${window.location.origin}${settings.app_settings.application_big_logo || "/images/logo/logo.png"
      }`;

  return (
    <>
      <Head>
        <title>Failed Submitted Data</title>
        <link
          rel="icon"
          type="image/png"
          href={`${settings.app_settings.application_favicon}`}
        />
      </Head>

      <Header authenticated={true} settings={settings} companyData={companyData} />

      <div className="min-h-[80vh] px-6 py-10 max-w-5xl mx-auto text-gray-800">



        {/* PDF content */}
        <div className="text-red-600 text-2xl mb-4 animate-shake">
          <div
            className="swal2-icon swal2-error swal2-animate-error-icon"
            style={{ display: "flex" }}
          >
            <span className="swal2-x-mark">
              <span className="swal2-x-mark-line-left"></span>
              <span className="swal2-x-mark-line-right"></span>
            </span>
          </div>
        </div>
        <div
          ref={pdfRef}
          className="bg-white rounded-lg bg_shadow p-10 space-y-6 border border-gray-200"
        >


          <h1 className="text-3xl font-bold text-center text-red-700 mb-2">
            Submitted Data After Failure
          </h1>

          {/* Meta row from URL/session */}
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
            {/* {form?.__meta?.sid && (
              <div>
                <strong>SID:</strong> {form.__meta.sid}
              </div>
            )} */}
            {form?.__meta?.brn && (
              <div>
                <strong>Booking Ref (BRN):</strong> {form.__meta.brn}
              </div>
            )}
            {form?.__meta?.dos && (
              <div>
                <strong>Timestamp (DOS):</strong> {form.__meta.dos}
              </div>
            )}
            {form?.__meta?.status && (
              <div>
                <strong>Status:</strong> {form.__meta.status}
              </div>
            )}
          </div>

          {/* <div>
            <strong>Company Name:</strong> {companyData?.company_name}
          </div>
          <div>
            <strong>HR Email:</strong> {form.company_email}
          </div>
          <div>
            <strong>Office Location:</strong> {form.office_location}
          </div>
          <div>
            <strong>Appointment Date:</strong>{" "}
            {formatDate(form.appointment_date)}
          </div> */}
          <div>
            <strong>Total Employees:</strong> {form.employees?.length || 0}
          </div>

          {/* Employee List */}
          <div className="pt-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Employee & Dependent Details
            </h2>

            {form.employees?.length > 0 ? (
              <div>
                {form.employees.map((emp, i) => (
                  <div
                    key={i}
                    className="mb-10 border border-gray-300 p-6 rounded-md bg-gray-50 shadow-sm"
                  >
                    <h3 className="text-xl font-semibold mb-4 text-red-800">
                      Employee #{i + 1}
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4 text-base">
                      <p>
                        <strong>Name:</strong> {emp.name}
                      </p>
                      <p>
                        <strong>Age:</strong> {emp.age}
                      </p>
                      <p>
                        <strong>Gender:</strong> {emp.gender}
                      </p>
                      <p>
                        <strong>Phone:</strong> {emp.phone}
                      </p>
                      <p>
                        <strong>Email:</strong> {emp.email}
                      </p>
                      {/* <p>
                        <strong>Designation:</strong> {emp.designation}
                      </p> */}
                    </div>

                    {/* Conditions */}
                    {Array.isArray(emp.conditions) && emp.conditions.length > 0 && (
                      <div className="mt-4">
                        <strong>Pre-existing Conditions:</strong>
                        <ul className="list-disc list-inside ml-4">
                          {emp.conditions.map((cond, cidx) => (
                            <li key={cidx}>{cond}</li>
                          ))}
                          {emp.conditions.includes("Other") &&
                            emp.other_condition && (
                              <li>
                                <strong>Other:</strong> {emp.other_condition}
                              </li>
                            )}
                        </ul>
                      </div>
                    )}

                    {/* Dependents */}
                    {emp.has_dependents && emp.dependents?.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold text-red-700 mb-3">
                          Dependents
                        </h4>
                        {emp.dependents.map((dep, j) => (
                          <div
                            key={j}
                            className="border-l-4 border-red-300 p-4  mb-4 bg-white rounded"
                          >
                            <p className="font-semibold text-gray-700 mb-1">
                              Dependent #{j + 1}
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 text-base">
                              <p>
                                <strong>Name:</strong> {dep.name}
                              </p>
                              <p>
                                <strong>Age:</strong> {dep.age}
                              </p>
                              <p>
                                <strong>Gender:</strong> {dep.gender}
                              </p>
                              <p>
                                <strong>Phone:</strong> {dep.phone}
                              </p>
                              <p>
                                <strong>Email:</strong> {dep.email}
                              </p>
                              {/* <p>
                                <strong>Relation:</strong> {dep.relation}
                              </p> */}
                            </div>
                            {Array.isArray(dep.conditions) &&
                              dep.conditions.length > 0 && (
                                <div className="mt-2">
                                  <strong>Conditions:</strong>
                                  <ul className="list-disc list-inside ml-4">
                                    {dep.conditions.map((c, idx) => (
                                      <li key={idx}>{c}</li>
                                    ))}
                                    {dep.conditions.includes("Other") &&
                                      dep.other_condition && (
                                        <li>
                                          <strong>Other:</strong>{" "}
                                          {dep.other_condition}
                                        </li>
                                      )}
                                  </ul>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No employee data found.</p>
            )}
          </div>

          <div className="mt-8 flex justify-center gap-4">
            {/* <button
              onClick={() => window.print()}
              className="bg-gray-600 text-white px-4 py-2 rounded shadow hover:bg-gray-700 print:hidden"
            >
              Print Page
            </button> */}

            <button
              onClick={handleDownloadPDF}
              className="bg-[#f80] text-white px-4 py-2 rounded shadow hover:bg-[#e67300] print:hidden"
            >
              Download as PDF
            </button>
          </div>
        </div>
      </div>

      <Footer companyName={settings.app_settings.company_name} />
    </>
  );
};

export default SubmittedDataViewFailed;
