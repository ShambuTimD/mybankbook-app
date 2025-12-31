import React, { useEffect, useState } from "react";
import { Head, router } from "@inertiajs/react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faComments,
    faArrowLeft,
    faSearch,
    faEye,
    faQuestion,
    faChevronDown,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import ComponentCard from "@/Components/common/ComponentCard";
import Header from "@/Pages/BrandSelfAppointment/Header";
import Footer from "@/Pages/BrandSelfAppointment/Footer";

const FaqPage = () => {
    const userData = JSON.parse(sessionStorage.getItem("session_user") || "{}");
    const token = userData?.token;

    const [companyData, setCompanyData] = useState(null);
    const [settings, setSettings] = useState({});

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
                        selectedOfficeName || parsedCompany.offices?.[0]?.office_name || "",
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
            } catch (e) {
                console.error("Session load error:", e);
            }
        }
    }, []);

    // FAQ Logic
    const [faqs, setFaqs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loadingFaqs, setLoadingFaqs] = useState(true);

    useEffect(() => {
        axios.get(route("frontend.settings")).then((res) => {
            if (res.data.success) setSettings(res.data.data.settings);
        });
    }, []);

    useEffect(() => {
        const fetchFaqs = async () => {
            setLoadingFaqs(true);
            try {
                const res = await axios.get(route("faq.index"), {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.data.success) setFaqs(res.data.data);
            } catch (e) {
                console.error("FAQ load error:", e);
            } finally {
                setLoadingFaqs(false);
            }
        };
        fetchFaqs();
    }, [token]);

    // Group + Filter FAQs
    const groupedFaqs = faqs.reduce((groups, faq) => {
        const cat = faq.category?.name || "General";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(faq);
        return groups;
    }, {});

    const filteredGroups = Object.entries(groupedFaqs).reduce(
        (acc, [category, items]) => {
            const filtered = items.filter((f) =>
                f.question.toLowerCase().includes(searchTerm.toLowerCase())
            );
            if (filtered.length > 0) acc[category] = filtered;
            return acc;
        },
        {}
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Head title="Frequently Asked Questions" />

            <Header
                authenticated={true}
                settings={settings}
                companyData={companyData}
                currentStep={0}
                steps={[]}
                isDashboardView={false}
            />

            {/* ======================== FAQ PAGE ============================ */}
            <main className="flex-1 p-6 w-full">
                <ComponentCard className="p-10 rounded-2xl shadow-md !bg-white">

                    {/* Header */}
                    <div className="relative w-full mb-10">

                        {/* Back Button */}
                        <button
                            onClick={() => router.visit("/f/support")}
                            className="absolute right-0 top-0 px-5 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center shadow-sm"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Back
                        </button>

                        {/* Center Icon + Title */}
                        <div className="flex flex-col items-center justify-center">
                            <div className="bg-blue-100 text-blue-600 w-16 h-16 flex items-center justify-center rounded-full mb-4 text-xl">
                                <FontAwesomeIcon icon={faComments} />
                            </div>

                            <h2 className="text-3xl font-normal text-gray-900">
                                Frequently Asked Questions
                            </h2>
                        </div>

                    </div>

                    {/* Search Bar */}
                    <div className="flex justify-center mb-10">
                        <div className="relative w-full max-w-xl mb-10">
                            <FontAwesomeIcon
                                icon={faSearch}
                                className="absolute left-3 top-3 text-gray-400"
                            />
                            <input
                                type="text"
                                placeholder="Search for answers..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* ===================== FAQ LIST ===================== */}
                    <div className="space-y-6">

                        {/* Loader */}
                        {loadingFaqs ? (
                            <div className="text-center py-14">
                                <FontAwesomeIcon
                                    icon={faSpinner}
                                    spin
                                    className="text-4xl text-indigo-600"
                                />
                                <p className="text-gray-500 mt-3">Loading FAQs...</p>
                            </div>
                        ) : (
                            <>
                                {Object.keys(filteredGroups).length === 0 ? (
                                    <p className="text-center text-gray-500 py-10">
                                        No FAQs found matching your search.
                                    </p>
                                ) : (
                                    Object.entries(filteredGroups).map(([category, items]) => (
                                        <details
                                            key={category}
                                            className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                                            open
                                        >
                                            <summary
                                                className="cursor-pointer text-lg font-normal text-gray-800 p-5 flex items-center justify-between hover:bg-gray-50"
                                            >
                                                {/* LEFT SIDE */}
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-indigo-100 text-indigo-600 w-10 h-10 flex items-center justify-center rounded-full">
                                                        <FontAwesomeIcon icon={faQuestion} />
                                                    </div>
                                                    {category}
                                                </div>

                                                {/* RIGHT SIDE ICON — CHANGES ON TOGGLE */}
                                                <FontAwesomeIcon
                                                    icon={faChevronDown}
                                                    className="text-gray-500 transition-transform duration-200 summary-icon"
                                                />
                                            </summary>

                                            <div className="px-6 py-4 space-y-5 bg-gray-50">
                                                {/* faq items */}
                                            </div>


                                            <div className="px-6 py-4 space-y-5 bg-gray-50">
                                                {items.map((faq) => (
                                                    <details
                                                        key={faq.id}
                                                        className="rounded-xl border border-gray-200 bg-white shadow-sm p-5"
                                                        open
                                                    >
                                                        {/* QUESTION */}
                                                        <summary className="cursor-pointer flex justify-between items-center text-blue-700 font-medium hover:text-blue-800">
                                                            <div className="flex items-center gap-3">
                                                                <span className="bg-blue-100 text-blue-600 w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold">
                                                                    Q
                                                                </span>
                                                                {faq.question}
                                                            </div>
                                                            <FontAwesomeIcon icon={faEye} className="text-blue-300" />
                                                        </summary>

                                                        {/* ANSWER */}
                                                        <div className="mt-4 border-t pt-4 flex items-start gap-3">
                                                            <span className="bg-green-100 text-green-600 w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold mt-1">
                                                                A
                                                            </span>
                                                            <p className="text-base text-gray-700 leading-relaxed">
                                                                {faq.answer}
                                                            </p>
                                                        </div>
                                                    </details>
                                                ))}
                                            </div>
                                        </details>
                                    ))
                                )}
                            </>
                        )}
                    </div>
                </ComponentCard>
            </main>

            <Footer companyName={settings?.company_name || "Corporate Wellness"} />
        </div>
    );
};

FaqPage.layout = null;
export default FaqPage;
