import React, { useEffect, useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import { Head, usePage } from "@inertiajs/react";
import Header from "./Header";
import Footer from "./Footer";

const SubmittedDataView = () => {
  const { settings } = usePage().props;
  const [form, setForm] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const pdfRef = useRef(null);

  useEffect(() => {
    const formData = sessionStorage.getItem("korpheal_booking_data");
    const companyInfo = sessionStorage.getItem("korpheal_company_data");

    if (formData && companyInfo) {
      setForm(JSON.parse(formData));
      setCompanyData(JSON.parse(companyInfo));
    }
  }, []);

  const handleDownloadPDF = () => {
    const element = pdfRef.current;
    const images = element.querySelectorAll("img");

    let loaded = 0;
    images.forEach((img) => {
      if (img.complete) loaded++;
      else
        img.onload = () => {
          loaded++;
          if (loaded === images.length) generatePDF();
        };
    });

    if (loaded === images.length) generatePDF();
  };

  const generatePDF = () => {
    const element = pdfRef.current;
    const opt = {
      margin: 0.3,
      filename: `KorpHeal_Booking_Details.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  };

  if (!form || !companyData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-xl">
        Loading submitted data...
      </div>
    );
  }

  const logoUrl =
    settings.app_settings.application_big_logo?.startsWith("http")
      ? settings.app_settings.application_big_logo
      : `${window.location.origin}${settings.app_settings.application_big_logo || "/images/logo/logo.png"}`;

  return (
    <>
      <Head>
        <title>Submitted Data</title>
        <link
          rel="icon"
          type="image/png"
          href={`${settings.app_settings.application_favicon}`}
        />
      </Head>
      <Header authenticated={true} settings={settings} companyData={companyData} />

      <div className="min-h-[80vh] px-6 py-10 max-w-5xl mx-auto text-gray-800">
        {/* Logo + Actions
        <div className="flex justify-between items-center mb-8">
          <img src={logoUrl} alt="Company Logo" className="h-12" />


        </div> */}

        {/* PDF content only */}
        <div id="pdf-content" ref={pdfRef} className="bg-white rounded-lg shadow p-6 space-y-6 border border-gray-200">
          <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">
            Submitted Booking Details
          </h1>

          {companyData?.company_name && (
            <div>
              <strong>Company Name:</strong> {companyData.company_name}
            </div>
          )}

          {form.company_email && (
            <div>
              <strong>Email:</strong> {form.company_email}
            </div>
          )}

          {form.office_location && (
            <div>
              <strong>Office Location:</strong> {form.office_location}
            </div>
          )}

          {form.appointment_date && (
            <div>
              <strong>Appointment Date:</strong>{" "}
              {(() => {
                const date = new Date(form.appointment_date);
                const day = String(date.getDate()).padStart(2, "0");
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const year = date.getFullYear();
                return `${day}-${month}-${year}`;
              })()}
            </div>
          )}

          {form.employees?.length > 0 && (
            <div>
              <strong>Total Employees:</strong> {form.employees.length}
            </div>
          )}


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
                    <h3 className="text-xl font-semibold mb-4 text-blue-800">
                      Employee #{i + 1}
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4 text-base">
                      {emp.name && <p><strong>Name:</strong> {emp.name}</p>}
                      {emp.age && <p><strong>Age:</strong> {emp.age}</p>}
                      {emp.gender && <p><strong>Gender:</strong> {emp.gender}</p>}
                      {emp.phone && <p><strong>Phone:</strong> {emp.phone}</p>}
                      {emp.email && <p><strong>Email:</strong> {emp.email}</p>}
                      {emp.designation && <p><strong>Designation:</strong> {emp.designation}</p>}
                    </div>

                    {Array.isArray(emp.conditions) && emp.conditions.length > 0 && (
                      <div className="mt-4">
                        <strong>Pre-existing Conditions:</strong>
                        <ul className="list-disc list-inside ml-4">
                          {emp.conditions
                            .filter((cond) => cond !== "Other")
                            .map((cond, cidx) => (
                              <li key={cidx}>{cond}</li>
                            ))}
                          {emp.conditions.includes("Other") && emp.other_condition && (
                            <li><strong>Other:</strong> {emp.other_condition}</li>
                          )}
                        </ul>
                      </div>
                    )}


                    {emp.has_dependents && emp.dependents?.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold text-blue-700 mb-2">
                          Dependents
                        </h4>
                        {emp.dependents.map((dep, j) => (
                          <div
                            key={j}
                            className="border-l-4 border-blue-300 pl-4 py-3 mb-4 bg-white rounded"
                          >
                            <p className="font-semibold text-gray-700 mb-1">
                              Dependent #{j + 1}
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 text-base">
                              {dep.name && <p><strong>Name:</strong> {dep.name}</p>}
                              {dep.age && <p><strong>Age:</strong> {dep.age}</p>}
                              {dep.gender && <p><strong>Gender:</strong> {dep.gender}</p>}
                              {dep.phone && <p><strong>Phone:</strong> {dep.phone}</p>}
                              {dep.email && <p><strong>Email:</strong> {dep.email}</p>}
                              {dep.relation && <p><strong>Relation:</strong> {dep.relation}</p>}
                            </div>
                            {Array.isArray(dep.conditions) && dep.conditions.length > 0 && (
                              <div className="mt-2">
                                <strong>Conditions:</strong>
                                <ul className="list-disc list-inside ml-4">
                                  {dep.conditions
                                    .filter((c) => c !== "Other")
                                    .map((c, idx) => (
                                      <li key={idx}>{c}</li>
                                    ))}
                                  {dep.conditions.includes("Other") && dep.other_condition && (
                                    <li><strong>Other:</strong> {dep.other_condition}</li>
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
        </div>
        <div className="flex gap-4 justify-center mt-8">
          {/* ✅ Print Button */}
          <button
            onClick={() => window.print()}
            className="bg-gray-600 text-white px-4 py-2 rounded shadow hover:bg-gray-700 print:hidden"
          >
            Print Page
          </button>

          {/* ✅ Download PDF Button */}
          <button
            onClick={handleDownloadPDF}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 print:hidden"
          >
            Download as PDF
          </button>
        </div>
      </div>

      <Footer companyName={settings.app_settings.company_name} />
    </>
  );
};

export default SubmittedDataView;
