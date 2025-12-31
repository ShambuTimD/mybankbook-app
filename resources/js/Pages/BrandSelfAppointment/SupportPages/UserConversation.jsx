import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faComments,
    faSpinner,
    faArrowLeft,
    faUser,
    faUserTie,
    faReply,
    faFile,
    faPaperclip,
    faDownload,
    faRotateRight,
    faClock,
    faTag,
    faCircleInfo,
    faTimesCircle,
    faImage
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Head, router } from "@inertiajs/react";

// Import Layout Components
import Header from "@/Pages/BrandSelfAppointment/Header";
import Footer from "@/Pages/BrandSelfAppointment/Footer";

dayjs.extend(relativeTime);

const UserConversation = ({
    id,
    selectedTicket: propTicket,
    ticketMessages: propMessages,
}) => {
    // --- SESSION & DATA ---
    const userData = JSON.parse(sessionStorage.getItem("session_user") || "{}");
    const token = userData?.token;

    // --- STATES ---
    const [ticket, setTicket] = useState(propTicket || null);
    const [messages, setMessages] = useState(propMessages || []);
    const [loading, setLoading] = useState(!propTicket);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Header/Footer States
    const [companyData, setCompanyData] = useState(null);
    const [settings, setSettings] = useState({});

    // Form States
    const [message, setMessage] = useState("");
    const [pendingAttachments, setPendingAttachments] = useState([]); // Unified state for files & previews
    const [buttonState, setButtonState] = useState("idle");

    // --- REFS ---
    const fileInputRef = useRef(null);
    const chatContainerRef = useRef(null);

    // --- CONSTANTS ---
    const isClosed = ticket?.status?.toLowerCase() === "closed";

    // --- 1. FETCH HEADER/FOOTER DATA ---
    useEffect(() => {
        const savedCompany = sessionStorage.getItem("session_company");
        const selectedOfficeName = sessionStorage.getItem("korpheal_selected_office_name");

        if (userData && savedCompany) {
            try {
                const parsedCompany = JSON.parse(savedCompany);
                const constructedData = {
                    company_name: parsedCompany.company_name,
                    logo: parsedCompany.logo || "",
                    offices: parsedCompany.offices || [],
                    display_center: selectedOfficeName || parsedCompany.offices?.[0]?.office_name || "",
                    hr_details: {
                        name: userData.first_name || "HR Team",
                        email: userData.email,
                        profile_image: "",
                        empid: `${userData.id}`,
                        designation: userData.role_title || "HR Admin",
                        role_name: userData.role_name,
                    },
                };
                setCompanyData(constructedData);
            } catch (e) {
                console.error("Error parsing session data:", e);
            }
        }

        // Fetch Settings
        axios.get(route("frontend.settings")).then((res) => {
            if (res.data.success) setSettings(res.data.data.settings);
        });
    }, []);

    // --- 2. FETCH TICKET DATA ---
    const fetchTicketData = async (silent = false) => {
        const targetId = id || ticket?.id;
        if (!targetId) return;

        if (!ticket && !silent) setLoading(true);

        try {
            const res = await axios.get(route("frontend.support.tickets.view", targetId), {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.data.success) {
                const ticketData = res.data.data.ticket || res.data.data;
                const msgData = res.data.data.messages || [];
                setTicket(ticketData);
                setMessages(msgData);
            } else {
                toast.error(res.data.message || "Could not load ticket.");
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to load ticket details.");
        } finally {
            setLoading(false);
        }
    };

    // Initial Data Sync
    useEffect(() => {
        if (!propTicket && id) {
            fetchTicketData();
        } else if (propTicket) {
            setTicket(propTicket);
            setMessages(propMessages);
        }
    }, [id, propTicket]);

    // Scroll to bottom when messages update
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // --- HANDLERS ---

    const handleBack = () => {
        router.visit(route('frontend.support.history'));
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchTicketData(true);
        setIsRefreshing(false);
        toast.success("Conversation updated");
    };

    const downloadZip = (chatId) => {
        axios({
            url: route("frontend.support.tickets.downloadZip", chatId),
            method: "GET",
            responseType: "blob",
            headers: { Authorization: `Bearer ${token}` },
        }).then((response) => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = `attachments_${chatId}.zip`;
            a.click();
        });
    };

    // --- FILE HANDLING (FIXED) ---
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newAttachments = files.map(file => ({
            file: file,
            id: Math.random().toString(36).substring(7),
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
            isImage: file.type.startsWith('image/')
        }));

        setPendingAttachments(prev => [...prev, ...newAttachments]);

        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeAttachment = (idToRemove) => {
        setPendingAttachments(prev => prev.filter(item => item.id !== idToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!message && pendingAttachments.length === 0) {
            toast.error("Message or attachment required");
            return;
        }

        setButtonState("loading");

        const formData = new FormData();
        formData.append("ticket_id", ticket.id);
        formData.append("message", message || "");

        pendingAttachments.forEach((item) => {
            formData.append("attachments[]", item.file);
        });

        try {
            const res = await axios.post(
                route("frontend.support.chat.send"),
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (res.data.success) {
                setMessage("");
                setPendingAttachments([]); // Clear previews

                await fetchTicketData(true);
                setButtonState("idle");
                toast.success("Reply sent successfully");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to send reply");
            setButtonState("idle");
        }
    };

    const getStatusColor = (s) => {
        switch (s) {
            case 'Open': return 'bg-green-100 text-green-700 border-green-200';
            case 'In Progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Resolved': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Closed': return 'bg-gray-100 text-gray-600 border-gray-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header authenticated={true} settings={settings} companyData={companyData} />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-blue-600 mb-4" />
                        <p className="text-gray-500">Loading conversation...</p>
                    </div>
                </main>
                <Footer companyName={settings?.company_name || "Corporate Wellness"} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative font-sans">
            <Head title={`#${ticket?.ticket_id || id}`} />

            <Header
                authenticated={true}
                settings={settings}
                companyData={companyData}
                currentStep={0}
                steps={[]}
                isDashboardView={false}
            />

            <main className="flex-1 p-4 md:p-8 w-full mx-auto">

                {/* PAGE HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-normal text-gray-900">
                                #{ticket?.srn || ticket?.ticket_id}
                            </h2>
                            <span className={`px-3 py-1 text-xs font-normal rounded-full border ${getStatusColor(ticket?.status)}`}>
                                {ticket?.status}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm">View conversation history and ticket details.</p>
                    </div>
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 transition font-medium"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Back to List
                    </button>
                </div>

                {/* GRID LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: CONVERSATION */}
                    <div className="lg:col-span-2 flex flex-col gap-6">

                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-[750px]">
                            {/* Chat Header */}
                            <div className="p-4 border-b bg-gray-50 flex justify-between items-center rounded-t-xl">
                                <h3 className="font-normal text-gray-700 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faComments} className="text-blue-600" />
                                    Conversation History
                                </h3>
                                <div className="flex items-center gap-3">
                                    <span className="px-2 py-1 bg-white border rounded text-xs text-gray-500 font-medium">
                                        {messages.length} Messages
                                    </span>
                                    <button
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        className={`
        inline-flex items-center gap-1.5
        px-2.5 py-1.5
        text-sm font-medium
        text-gray-500
        rounded-md
        hover:bg-blue-50 hover:text-blue-600
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
    `}
                                        title={isRefreshing ? "Refreshing…" : "Refresh"}
                                    >
                                        <FontAwesomeIcon
                                            icon={faRotateRight}
                                            className={isRefreshing ? "animate-spin" : ""}
                                        />
                                        <span className="hidden sm:inline">
                                            {isRefreshing ? "Refreshing…" : "Refresh"}
                                        </span>
                                    </button>

                                </div>
                            </div>

                            {/* Messages Area */}
                            <div
                                ref={chatContainerRef}
                                className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6 scroll-smooth"
                            >
                                {messages.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                        <FontAwesomeIcon icon={faComments} className="text-4xl mb-2" />
                                        <p>No messages yet. Start the conversation.</p>
                                    </div>
                                )}

                                {messages.map((msg, index) => {
                                    const isAdmin = msg.sender_id && msg.sender_id !== userData?.id;
                                    const isUser = !isAdmin;
                                    const prevMsg = messages[index - 1];
                                    const showDateDivider = !prevMsg || dayjs(prevMsg.created_at).format("DD MMM YYYY") !== dayjs(msg.created_at).format("DD MMM YYYY");

                                    // Bubble Styles
                                    const bubbleClass = isUser
                                        ? "bg-blue-600 text-white rounded-2xl rounded-tr-none"
                                        : "bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-tl-none";

                                    return (
                                        <div key={msg.id} className="w-full">
                                            {showDateDivider && (
                                                <div className="flex justify-center mb-6">
                                                    <span className="text-xs font-medium bg-gray-200 text-gray-600 px-3 py-1 rounded-full">
                                                        {dayjs(msg.created_at).format("MMM DD, YYYY")}
                                                    </span>
                                                </div>
                                            )}

                                            <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
                                                <div className={`flex max-w-[85%] md:max-w-[75%] items-end gap-3`}>

                                                    {/* ADMIN ICON */}
                                                    {isAdmin && (
                                                        <div className="shrink-0 w-8 h-8 rounded-full bg-white border flex items-center justify-center text-blue-600 shadow-sm">
                                                            <FontAwesomeIcon icon={faUserTie} size="sm" />
                                                        </div>
                                                    )}

                                                    {/* MESSAGE BUBBLE */}
                                                    <div className={`p-4 shadow-sm text-sm leading-relaxed relative group ${bubbleClass}`}>
                                                        {/* Attachments Display */}
                                                        {msg.attachment_urls?.length > 0 && (
                                                            <div className="space-y-2 mb-3">
                                                                {msg.attachment_urls.map((file, i) => {
                                                                    const fileUrl = typeof file === "string" ? file : file?.url || "";
                                                                    if (!fileUrl) return null;
                                                                    const isImg = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileUrl);

                                                                    return isImg ? (
                                                                        <a key={i} href={fileUrl} target="_blank" rel="noreferrer" className="block group/img">
                                                                            <div className="relative overflow-hidden rounded-lg bg-black/5">
                                                                                <img src={fileUrl} className="w-full max-h-48 object-cover transition-transform duration-300 group-hover/img:scale-105" alt="Attachment" />
                                                                            </div>
                                                                        </a>
                                                                    ) : (
                                                                        <a key={i} href={fileUrl} target="_blank" rel="noreferrer" className={`flex items-center gap-3 text-sm p-3 rounded-lg border transition ${isUser ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-800'}`}>
                                                                            <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center">
                                                                                <FontAwesomeIcon icon={faFile} />
                                                                            </div>
                                                                            <span className="truncate flex-1 font-medium">{typeof file === "object" ? file.name : "Download File"}</span>
                                                                        </a>
                                                                    );
                                                                })}
                                                                <button
                                                                    onClick={() => downloadZip(msg.id)}
                                                                    className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full transition shadow-sm mt-1 ${isUser ? 'bg-white text-blue-600 hover:bg-gray-100' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                                                                >
                                                                    <FontAwesomeIcon icon={faDownload} /> ZIP
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* Text */}
                                                        {msg.message && (
                                                            <p className="whitespace-pre-wrap">{msg.message}</p>
                                                        )}

                                                        {/* Footer */}
                                                        <div className={`flex items-center gap-1.5 mt-2 text-[10px] uppercase tracking-wide font-medium ${isUser ? 'text-blue-100 justify-end' : 'text-gray-400 justify-start'}`}>
                                                            <span>{msg.sender?.name || (isAdmin ? "Support" : "User")}</span>
                                                            <span className="opacity-50">•</span>
                                                            <span>{dayjs(msg.created_at).format("hh:mm A")}</span>
                                                        </div>
                                                    </div>

                                                    {/* USER ICON */}
                                                    {isUser && (
                                                        <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                                                            <FontAwesomeIcon icon={faUser} size="sm" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Reply Area */}
                            {ticket.status !== "Closed" ? (
                                <div className="p-4 bg-white border-t rounded-b-xl">

                                    {/* PREVIEW SECTION (Above input) */}
                                    {pendingAttachments.length > 0 && (
                                        <div className="flex gap-3 overflow-x-auto pb-4 mb-2">
                                            {pendingAttachments.map((item) => (
                                                <div key={item.id} className="relative w-24 h-24 shrink-0 rounded-lg border bg-gray-50 overflow-hidden group">
                                                    {item.isImage ? (
                                                        <img src={item.preview} alt="preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-2">
                                                            <FontAwesomeIcon icon={faFile} className="text-2xl mb-1" />
                                                            <span className="text-[10px] text-center w-full truncate">{item.name}</span>
                                                        </div>
                                                    )}

                                                    {/* Remove Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAttachment(item.id)}
                                                        className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition backdrop-blur-sm"
                                                    >
                                                        <FontAwesomeIcon icon={faTimesCircle} className="text-xl" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit} className="w-full">
                                        <div className="relative flex items-end w-full border border-gray-300 rounded-xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500">

                                            {/* TEXTAREA */}
                                            <textarea
                                                className="
                flex-1 resize-none border-0 bg-transparent
                px-4 py-3 text-sm
                focus:outline-none focus:ring-0
                placeholder:text-gray-400
                min-h-[56px] max-h-[140px]
            "
                                                rows={2}
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                placeholder="Type your reply here..."
                                            />

                                            {/* ACTIONS (Attach + Send) */}
                                            <div className="flex items-center gap-1 pr-2 pb-2">

                                                {/* ATTACH */}
                                                <input
                                                    id="fileUpload"
                                                    type="file"
                                                    multiple
                                                    className="hidden"
                                                    onChange={handleFileChange}
                                                    ref={fileInputRef}
                                                />
                                                <label
                                                    htmlFor="fileUpload"
                                                    className="
                    cursor-pointer text-gray-400
                    hover:text-blue-600
                    transition
                    p-2 rounded-full
                    hover:bg-gray-100
                "
                                                    title="Attach file"
                                                >
                                                    <FontAwesomeIcon icon={faPaperclip} className="text-lg" />
                                                </label>

                                                {/* SEND */}
                                                <button
                                                    type="submit"
                                                    disabled={buttonState !== "idle"}
                                                    className={`
                    h-9 px-4
                    rounded-lg
                    text-sm font-medium text-white
                    flex items-center gap-2
                    transition-all
                    ${buttonState === "loading"
                                                            ? "bg-blue-400 cursor-not-allowed"
                                                            : "bg-blue-600 hover:bg-blue-700"
                                                        }
                `}
                                                >
                                                    {buttonState === "loading" ? (
                                                        <>
                                                            <FontAwesomeIcon icon={faSpinner} spin />
                                                            Sending
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FontAwesomeIcon icon={faReply} />
                                                            Send
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* FOOTER INFO */}
                                        <div className="flex justify-between mt-2 px-1">
                                            <span className="text-xs text-gray-400">
                                                {pendingAttachments.length > 0
                                                    ? `${pendingAttachments.length} file(s) attached`
                                                    : ""}
                                            </span>
                                        </div>
                                    </form>

                                </div>
                            ) : (
                                <div className="p-6 bg-gray-50 border-t rounded-b-xl text-center text-gray-500 text-sm font-medium">
                                    This ticket is closed. You cannot reply to this conversation.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: TICKET DETAILS (Sticky Sidebar) */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sticky top-6 space-y-6">

                            <div className="border-b pb-4">
                                <h3 className="text-lg font-normal text-gray-800 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faCircleInfo} className="text-gray-400" />
                                    Ticket Information
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {/* Ticket No */}
                                <div>
                                    <label className="text-xs font-normal text-gray-500 uppercase tracking-wider block mb-1">Ticket ID</label>
                                    <div className="font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                                        {ticket.srn || ticket.ticket_id}
                                    </div>
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="text-xs font-normal text-gray-500 uppercase tracking-wider block mb-1">Subject</label>
                                    <p className="text-gray-800 font-medium text-sm leading-relaxed">
                                        {ticket.subject}
                                    </p>
                                </div>

                                {/* Created Date */}
                                <div>
                                    <label className="text-xs font-normal text-gray-500 uppercase tracking-wider block mb-1">Created On</label>
                                    <div className="flex items-center gap-2 text-gray-700 text-sm">
                                        <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                                        {dayjs(ticket.created_at).format("MMM DD, YYYY • hh:mm A")}
                                    </div>
                                </div>

                                {/* Category (Optional) */}
                                {ticket.category && (
                                    <div>
                                        <label className="text-xs font-normal text-gray-500 uppercase tracking-wider block mb-1">Category</label>
                                        <div className="flex items-center gap-2 text-gray-700 text-sm">
                                            <FontAwesomeIcon icon={faTag} className="text-gray-400" />
                                            {ticket.category}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="border-t pt-4">
                                <p className="text-xs text-gray-400 text-center">
                                    Need immediate assistance? Contact our support hotline.
                                </p>
                            </div>

                        </div>
                    </div>

                </div>
            </main>

            <Footer companyName={settings?.company_name || "Corporate Wellness"} />
        </div>
    );
};

export default UserConversation;