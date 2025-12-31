import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faComments,
    faTicket,
    faPlus,
    faEye,
    faUserTie,
    faEnvelope,
    faHeadset,
    faArrowRight,
    faTimes // Added for the close button
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { router } from "@inertiajs/react";

export default function Support() {
    const [supportSettings, setSupportSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Existing Modal State (Email/WhatsApp)
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState(""); 

    // New State for Live Chat Iframe Modal
    const [chatModalOpen, setChatModalOpen] = useState(false);

    const userData = JSON.parse(sessionStorage.getItem("session_user") || "{}");
    const token = userData?.token;
    const bookingData = JSON.parse(sessionStorage.getItem("korpheal_booking_data"));
    const userEmail = bookingData?.company_email;


    const fetchDashboardSettings = async () => {
        setLoading(true);
        try {
            const res = await axios.get(route("dashboard.settings"), {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.data.success) {
                setSupportSettings(res.data.data.support);
            }
        } catch (e) {
            console.error("Failed loading dashboard settings", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardSettings();
    }, []);

    const openHistory = () => {
        router.visit("/f/support/history");
    };

    // Reusable Card Container
    const CardWrapper = ({ children, colorClass, hoverBorderClass }) => (
        <div className={`group relative bg-white rounded-2xl p-8 shadow-md border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden`}>
            {/* Top Hover Line Animation */}
            <div className={`absolute top-0 left-0 w-full h-1.5 ${hoverBorderClass} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
            <div className="flex flex-col items-center text-center space-y-5 relative z-10">
                {children}
            </div>
        </div>
    );

    // Skeleton Loader Component
    const SkeletonCard = () => (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-pulse">
            <div className="flex flex-col items-center space-y-5">
                {/* Icon Placeholder */}
                <div className="w-20 h-20 bg-gray-200 rounded-2xl"></div>
                {/* Title Placeholder */}
                <div className="h-8 w-32 bg-gray-200 rounded"></div>
                {/* Text Placeholder */}
                <div className="h-4 w-56 bg-gray-200 rounded"></div>
                <div className="h-4 w-40 bg-gray-200 rounded"></div>
                {/* Button Placeholder */}
                <div className="h-12 w-40 bg-gray-200 rounded-xl mt-4"></div>
            </div>
        </div>
    );

    // Existing Modal for Email/WhatsApp
    const SupportModal = ({ open, onClose, mode }) => {
        if (!open) return null;

        const isEmail = mode === "email";
        const buttonText = isEmail ? "Connect via Email" : "Connect via WhatsApp";

        const handleConnect = () => {
            if (isEmail) {
                openGmailCompose();
            } else {
                window.open("https://wa.me/8820111123", "_blank");
            }
            onClose();
        };

        return (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-[3px] flex items-center justify-center z-50">
                <div className="bg-[#fafafa] rounded-3xl p-8 w-full max-w-md shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-200">
                    <h2 className="text-xl font-normal text-gray-900 mb-4 text-center">
                        Support Availability
                    </h2>
                    <p className="text-center text-gray-700 leading-relaxed mb-2">
                        Monday to Saturday — <strong className="text-gray-900">11:00 AM to 5:00 PM</strong>
                    </p>
                    <p className="text-center text-gray-500 text-sm mb-6">
                        (Excluding Public Holidays)
                    </p>
                    <button onClick={handleConnect} className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium">
                        {buttonText}
                    </button>
                    <button onClick={onClose} className="w-full mt-4 py-2 text-gray-500 hover:text-gray-700 text-sm transition-all">
                        Close
                    </button>
                </div>
            </div>
        );
    };

    // --- NEW CHAT IFRAME MODAL ---
// --- NEW CHAT IFRAME MODAL ---
    const ChatModal = ({ open, onClose }) => {
        // ✅ Add this useEffect to handle body scrolling
        useEffect(() => {
            if (open) {
                // Disable scroll on body when modal is open
                document.body.style.overflow = "hidden";
            } else {
                // Restore scroll when modal is closed
                document.body.style.overflow = "unset";
            }

            // Cleanup function to ensure scroll is restored if component unmounts
            return () => {
                document.body.style.overflow = "unset";
            };
        }, [open]);

        if (!open) return null;

        return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                {/* Modal Container */}
                <div className="bg-white w-full max-w-md h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up relative">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-50">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <h3 className="font-semibold text-gray-700">Live Support</h3>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="text-gray-400 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    {/* Iframe Content */}
                    <div className="flex-1 bg-gray-100 relative">
                        <iframe 
                            src="https://tawk.to/chat/693ff5f565b580197cc5f1e0/1jcgthije"
                            className="absolute inset-0 w-full h-full border-none"
                            title="Live Chat Support"
                            allow="microphone;"
                        ></iframe>
                    </div>
                </div>
            </div>
        );
    };

    const openGmailCompose = () => {
        const bookingData = JSON.parse(sessionStorage.getItem("korpheal_booking_data"));
        const userEmail = bookingData?.company_email || ""; 
        const supportEmail = "support@korpheal.com";
        const subject = encodeURIComponent("Need Support Assistance");
        const body = encodeURIComponent(
            `Hello Support Team,\n\nI need assistance regarding my corporate booking.\n\nRegards,\n${userEmail}`
        );
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${supportEmail}&su=${subject}&body=${body}`;
        window.open(gmailUrl, "_blank");
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">

            {/* DASHBOARD GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {loading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : (
                    <>
                        {/* 1. FAQ CARD */}
                        {supportSettings?.faq_active && (
                            <CardWrapper colorClass="text-blue-600" hoverBorderClass="bg-gradient-to-r from-blue-500 to-cyan-400">
                                <div className="bg-blue-50 text-blue-600 p-5 rounded-2xl w-20 h-20 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <FontAwesomeIcon icon={faComments} className="text-3xl" />
                                </div>

                                <div>
                                    <h3 className="text-2xl font-normal text-gray-800 group-hover:text-blue-600 transition-colors">
                                        {supportSettings.faq}
                                    </h3>
                                    <p className="text-base text-gray-500 mt-3 leading-relaxed">
                                        {supportSettings.faq_desc}
                                    </p>
                                </div>

                                <button
                                    disabled={!supportSettings.faq_enable}
                                    className={`mt-2 px-8 py-3 rounded-xl flex items-center gap-2 transition-all ${supportSettings.faq_enable
                                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        }`}
                                    onClick={() =>
                                        supportSettings.faq_enable && router.visit("/f/support/faq")
                                    }
                                >
                                    <FontAwesomeIcon icon={faEye} />
                                    <span>View FAQ</span>
                                </button>
                            </CardWrapper>
                        )}

                        {/* 2. SUPPORT TICKETS CARD */}
                        {supportSettings?.ticket_active && (
                            <CardWrapper colorClass="text-indigo-600" hoverBorderClass="bg-gradient-to-r from-indigo-500 to-purple-400">
                                <div className="bg-indigo-50 text-indigo-600 p-5 rounded-2xl w-20 h-20 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <FontAwesomeIcon icon={faTicket} className="text-3xl" />
                                </div>

                                <div>
                                    <h3 className="text-2xl font-normal text-gray-800 group-hover:text-indigo-600 transition-colors">
                                        {supportSettings.ticket}
                                    </h3>
                                    <p className="text-base text-gray-500 mt-3 leading-relaxed">
                                        {supportSettings.ticket_desc}
                                    </p>
                                </div>

                                <div className="flex flex-wrap justify-center gap-4 w-full pt-2">
                                    <button
                                        disabled={!supportSettings.ticket_enable}
                                        onClick={() =>
                                            supportSettings.ticket_enable &&
                                            router.visit("/f/support/raise-ticket/new")
                                        }
                                        className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${supportSettings.ticket_enable
                                            ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg"
                                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                            }`}
                                    >
                                        <FontAwesomeIcon icon={faPlus} />
                                        <span>New Ticket</span>
                                    </button>

                                    <button
                                        disabled={!supportSettings.ticket_enable}
                                        onClick={() => supportSettings.ticket_enable && openHistory()}
                                        className={`px-6 py-3 rounded-xl flex items-center gap-2 transition-all ${supportSettings.ticket_enable
                                            ? "bg-white border border-gray-200 hover:bg-gray-50 hover:text-indigo-600"
                                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                            }`}
                                    >
                                        <FontAwesomeIcon icon={faEye} />
                                        <span>View History</span>
                                    </button>
                                </div>
                            </CardWrapper>
                        )}

                        {/* 3. CONTACT SUPPORT CARD */}
                        {supportSettings?.contact_active && (
                            <CardWrapper
                                colorClass="text-amber-500"
                                hoverBorderClass="bg-gradient-to-r from-amber-400 to-orange-400"
                            >
                                <div className="bg-amber-50 text-amber-600 p-5 rounded-2xl w-20 h-20 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <FontAwesomeIcon icon={faUserTie} className="text-3xl" />
                                </div>

                                <div>
                                    <h3 className="text-2xl font-normal text-gray-800 group-hover:text-amber-600 transition-colors">
                                        {supportSettings.contact}
                                    </h3>
                                    <p className="text-base text-gray-500 mt-3 leading-relaxed">
                                        {supportSettings.contact_desc}
                                    </p>
                                </div>

                                <div className="flex flex-wrap justify-center gap-4 w-full pt-2">
                                    <button
                                        disabled={!supportSettings.contact_enable}
                                        className={`px-6 py-3 rounded-xl flex items-center gap-2 transition ${supportSettings.contact_enable
                                            ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                            }`}
                                        onClick={() => {
                                            if (!supportSettings.contact_enable) return;
                                            setModalMode("email");
                                            setModalOpen(true);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faEnvelope} />
                                        Email
                                    </button>

                                    <button
                                        disabled={!supportSettings.contact_enable}
                                        className={`px-6 py-3 rounded-xl flex items-center gap-2 transition ${supportSettings.contact_enable
                                            ? "bg-green-500 text-white hover:bg-green-600 shadow-md"
                                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                            }`}
                                        onClick={() => {
                                            if (!supportSettings.contact_enable) return;
                                            setModalMode("whatsapp");
                                            setModalOpen(true);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faComments} />
                                        WhatsApp
                                    </button>
                                </div>
                            </CardWrapper>
                        )}
                        
                        {/* 4. INSTANT CHAT CARD */}
                        {supportSettings?.chat_active && (
                            <CardWrapper colorClass="text-emerald-500" hoverBorderClass="bg-gradient-to-r from-emerald-400 to-teal-400">
                                <div className="bg-emerald-50 text-emerald-600 p-5 rounded-2xl w-20 h-20 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300"> 
                                    <FontAwesomeIcon icon={faHeadset} className="text-3xl" /> 
                                </div>

                                <div>
                                    <h3 className="text-2xl font-normal text-gray-800">
                                        {supportSettings.chat}
                                    </h3>
                                    <p className="text-base text-gray-500 mt-3 leading-relaxed">
                                        {supportSettings.chat_desc}
                                    </p>
                                </div>

                                {/* Updated Live Chat Button */}
                                <button
                                    disabled={!supportSettings.chat_enable}
                                    className={`mt-2 px-8 py-3 rounded-xl flex items-center gap-2 transition-all ${supportSettings.chat_enable
                                            ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg"
                                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        }`}
                                    onClick={() => {
                                        if (!supportSettings.chat_enable) return;
                                        setChatModalOpen(true); // Open the iframe modal
                                    }}
                                >
                                    <FontAwesomeIcon icon={faComments} />
                                    <span>Live Chat</span>
                                    <FontAwesomeIcon icon={faArrowRight} />
                                </button>
                            </CardWrapper>
                        )}

                    </>
                )}
            </div>

            {/* Email/WhatsApp Modal */}
            <SupportModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                mode={modalMode}
            />

            {/* New Live Chat Iframe Modal */}
            <ChatModal 
                open={chatModalOpen}
                onClose={() => setChatModalOpen(false)}
            />
        </div>
    );
}