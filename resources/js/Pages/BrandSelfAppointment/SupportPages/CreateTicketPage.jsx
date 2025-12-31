import React, { useState, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTicket,
    faBuilding,
    faPen,
    faAlignLeft,
    faPaperclip,
    faArrowLeft,
    faSpinner,
    faCheckCircle,
    faList,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import Select from "react-select";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import ComponentCard from "@/Components/common/ComponentCard";
import Header from "@/Pages/BrandSelfAppointment/Header";
import Footer from "@/Pages/BrandSelfAppointment/Footer";

const CreateTicketPage = () => {
    const userData = JSON.parse(sessionStorage.getItem("session_user") || "{}");
    const token = userData?.token;

    const [companyData, setCompanyData] = useState(null);
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        office: null,
        subject: "",
        description: "",
        file: null,
    });

    const [fileName, setFileName] = useState("");
    const [submittedTicket, setSubmittedTicket] = useState(null);

    useEffect(() => {
        const savedUser = sessionStorage.getItem("session_user");
        const savedCompany = sessionStorage.getItem("session_company");
        const selectedOfficeName = sessionStorage.getItem("korpheal_selected_office_name");

        if (savedUser && savedCompany) {
            try {
                const parsedUser = JSON.parse(savedUser);
                const parsedCompany = JSON.parse(savedCompany);

                const constructedData = {
                    company_name: parsedCompany.company_name,
                    logo: parsedCompany.logo || "",
                    offices: parsedCompany.offices || [],
                    display_center:
                        selectedOfficeName ||
                        parsedCompany.offices?.[0]?.office_name ||
                        "",
                    hr_details: {
                        name: parsedUser.first_name || "HR Team",
                        email: parsedUser.email,
                        profile_image: "",
                        empid: `${parsedUser.id}`,
                        designation: parsedUser.role_title || "HR Admin",
                        role_name: parsedUser.role_name,
                    },
                };

                setCompanyData(constructedData);

                if (constructedData.offices.length === 1) {
                    const onlyOffice = constructedData.offices[0].office_name;
                    setForm((prev) => ({
                        ...prev,
                        office: { value: onlyOffice, label: onlyOffice },
                    }));
                }
            } catch (e) {
                console.error("Error parsing session data:", e);
            }
        }

        axios.get(route("frontend.settings")).then((res) => {
            if (res.data.success) setSettings(res.data.data.settings);
        });
    }, []);

    const handleOfficeChange = (selectedOption) => {
        setForm((prev) => ({ ...prev, office: selectedOption }));
    };

    const handleSubjectChange = (e) => {
        setForm((prev) => ({ ...prev, subject: e.target.value }));
    };

    const handleDescriptionChange = (content) => {
        setForm((prev) => ({ ...prev, description: content }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm((prev) => ({ ...prev, file }));
            setFileName(file.name);
        }
    };

    const getCurrentDateFormatted = () => {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, "0");
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const yyyy = today.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
    };

    const submitTicket = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append("subject", form.subject);
        formData.append("description", form.description);
        formData.append("office_location", form.office?.value || "");

        if (form.file) {
            formData.append("attachment", form.file);
        }

        formData.append("priority", "Medium");
        formData.append("category", "General");

        try {
            const res = await axios.post(route("frontend.support.tickets.store"), formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            const newId =
                res.data.ticket?.ticket_id ||
                res.data.data?.ticket?.ticket_id ||
                res.data.data?.id ||
                res.data.id;

            if (newId) sessionStorage.setItem("new_ticket_id", newId);

            toast.success("Ticket created successfully!");

            setSubmittedTicket({
                refNumber: newId || "N/A",
                date: getCurrentDateFormatted(),
                office: form.office?.label || "N/A",
                subject: form.subject,
                description: form.description,
            });
        } catch (err) {
            console.error(err);
            toast.error("Failed to create ticket.");
        } finally {
            setLoading(false);
        }
    };

    const officeOptions =
        companyData?.offices?.map((off) => ({
            value: off.office_id,
            label: off.office_name,
        })) || [];

    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            padding: "6px",
            borderRadius: "0.75rem",
            borderColor: state.isFocused ? "#6366f1" : "#e5e7eb",
            borderWidth: "2px",
            boxShadow: "none",
            "&:hover": {
                borderColor: "#6366f1",
            },
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: "0.75rem",
            overflow: "hidden",
            zIndex: 9999,
        }),
    };

    const quillModules = {
        toolbar: [
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link"],
            ["clean"],
        ],
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Head title="Create Support Ticket" />

            <Header
                authenticated={true}
                settings={settings}
                companyData={companyData}
                currentStep={0}
                steps={[]}
            />

            <main className="flex-1 p-6 w-full">
                <ComponentCard className="p-10 rounded-2xl shadow-lg bg-white w-full mx-auto">

                    {/* ---------- HEADER ---------- */}
                    {!submittedTicket && (
                        <div className="relative mb-12">

                            {/* Back Button - stays at right */}
                            <button
                                onClick={() => router.visit("/f/support")}
                                className="absolute right-0 top-0 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 
                       rounded-lg text-gray-600 hover:bg-gray-50 shadow-sm"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} />
                                Back
                            </button>

                            {/* Centered Icon + Heading */}
                            <div className="flex flex-col items-center justify-center text-center mt-6">
                                <div className="bg-indigo-100 text-indigo-600 w-16 h-16 flex items-center 
                            justify-center rounded-full text-xl shadow-sm mb-4">
                                    <FontAwesomeIcon icon={faTicket} />
                                </div>

                                <h2 className="text-3xl font-normal text-gray-900">
                                    Create Support Ticket
                                </h2>

                                <p className="text-gray-500 mt-1 text-sm">
                                    Submit an issue and our support team will respond shortly.
                                </p>
                            </div>
                        </div>
                    )}


                    {/* ---------- SUCCESS SCREEN ---------- */}
                    {submittedTicket ? (
                        <div className="animate-fade-in-up flex flex-col items-center">

                            {/* Compact Success Banner */}
                            <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center shadow-sm w-full max-w-2xl">
                                <FontAwesomeIcon
                                    icon={faCheckCircle}
                                    className="text-green-500 text-5xl mb-4"
                                />
                                <h3 className="text-2xl font-normal text-green-700">
                                    Ticket Submitted!
                                </h3>
                                <p className="text-green-600 mt-2">
                                    Our team will get back to you soon.
                                </p>
                            </div>

                            {/* Compact Ticket Details Box */}
                            <div className="bg-white mt-6 rounded-2xl border border-gray-200 p-8 shadow-sm w-full max-w-2xl">
                                <h4 className="text-xl font-normal text-gray-800 mb-6 text-center">
                                    Ticket Details
                                </h4>

                                <div className="space-y-4">
                                    <DetailRow label="Reference Number" value={`#${submittedTicket.refNumber}`} />
                                    <DetailRow label="Date" value={submittedTicket.date} />
                                    <DetailRow label="Office" value={submittedTicket.office} />
                                    <DetailRow label="Subject" value={submittedTicket.subject} />

                                    {/* <div className="flex flex-col md:flex-row md:items-start border-b pb-4">
                                        <p className="w-full md:w-1/3 text-sm font-medium text-gray-500">
                                            Description
                                        </p>
                                        <div
                                            className="text-gray-800 leading-relaxed w-full md:w-2/3"
                                            dangerouslySetInnerHTML={{ __html: submittedTicket.description }}
                                        />
                                    </div> */}
                                </div>

                                {/* Button */}
                                <div className="flex justify-center mt-8">
                                    <button
                                        onClick={() => router.visit("/f/support/history")}
                                        className="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center gap-2 shadow-md"
                                    >
                                        <FontAwesomeIcon icon={faList} />
                                        View All Tickets
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (

                        /* ---------- FORM ---------- */
                        <form onSubmit={submitTicket} className="space-y-10 max-w-3xl mx-auto">

                            {/* OFFICE SECTION */}
                            <FormSection
                                icon={faBuilding}
                                title={
                                    <>
                                        Office Location <span className="text-red-500">*</span>
                                    </>
                                }
                                children={
                                    <Select
                                        options={officeOptions}
                                        value={form.office}
                                        onChange={handleOfficeChange}
                                        placeholder="Select your office"
                                        styles={customSelectStyles}
                                    />
                                }
                            />


                            {/* TICKET DETAILS SECTION */}
                            <FormSection
                                icon={faPen}
                                title={
                                    <>
                                        Ticket Details <span className="text-red-500">*</span>
                                    </>
                                }
                                children={
                                    <>
                                        {/* Subject */}
                                        <label className="font-medium text-gray-700 mb-2 block">
                                            Subject <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            value={form.subject}
                                            onChange={handleSubjectChange}
                                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-indigo-600"
                                            placeholder="Short subject for issue"
                                            required
                                        />

                                        {/* Description */}
                                        <label className="font-medium text-gray-700 mb-2 mt-6 block">
                                            Description <span className="text-red-500">*</span>
                                        </label>
                                        <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                                            <ReactQuill
                                                theme="snow"
                                                value={form.description}
                                                onChange={handleDescriptionChange}
                                                modules={quillModules}
                                                className="bg-white text-base h-40"
                                                placeholder="Describe the issue in detail..."
                                            />
                                        </div>
                                    </>
                                }
                            />

                            {/* FILE SECTION */}
                            <FormSection
                                icon={faPaperclip}
                                title="Attachment (Optional)"
                                children={
                                    <label
                                        htmlFor="file-upload"
                                        className="w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl px-6 py-8 cursor-pointer hover:bg-gray-50"
                                    >
                                        <input
                                            type="file"
                                            id="file-upload"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            accept="image/*,.pdf"
                                        />

                                        {fileName ? (
                                            <span className="text-green-600 font-medium flex items-center gap-2">
                                                <FontAwesomeIcon icon={faCheckCircle} />
                                                {fileName}
                                            </span>
                                        ) : (
                                            <span className="text-gray-500">
                                                Click to upload image or PDF
                                            </span>
                                        )}
                                    </label>
                                }
                            />

                            {/* SUBMIT BUTTON (INSIDE FORM) */}
                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-normal rounded-xl shadow-md flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin />
                                            Processing...
                                        </>
                                    ) : (
                                        "Submit Ticket"
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </ComponentCard>
            </main>

            <Footer companyName={settings?.company_name || "Corporate Wellness"} />
        </div>
    );
};

const DetailRow = ({ label, value }) => (
    <div className="flex flex-col md:flex-row md:items-center border-b pb-4">
        <p className="w-full md:w-1/3 text-sm font-medium text-gray-500">{label}</p>
        <p className="text-gray-800 w-full md:w-2/3">{value}</p>
    </div>
);

const FormSection = ({ icon, title, children }) => (
    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
            <FontAwesomeIcon icon={icon} className="text-indigo-500" />
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-1">
                {title}
            </h3>
        </div>
        {children}
    </div>
);


CreateTicketPage.layout = null;
export default CreateTicketPage;
