import React, { useState, useEffect, useRef } from "react";
import { router, Head } from "@inertiajs/react";
import axios from "axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPaperclip,
    faDownload,
    faFile,
    faRotateRight,
    faSpinner,
    faUser,
    faTimesCircle, // <--- Imported for remove button
} from "@fortawesome/free-solid-svg-icons";

// Initialize dayjs
dayjs.extend(relativeTime);

export default function TicketView({ ticket, admins }) {
    const [message, setMessage] = useState("");
    const [chatList, setChatList] = useState(ticket.chats ?? []);
    const [status, setStatus] = useState(ticket.status);

    // Unified attachments state
    const [pendingAttachments, setPendingAttachments] = useState([]); 
    const [attachmentErrors, setAttachmentErrors] = useState("");
    
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSending, setIsSending] = useState(false); // Add sending state
    const chatContainerRef = useRef(null);
    const fileInputRef = useRef(null);

    /* -------------------------
        AUTO SCROLL TO BOTTOM
    --------------------------*/
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatList]);

    /* -------------------------
        REFRESH CHAT
    --------------------------*/
    const refresh = () => {
        setIsRefreshing(true);
        axios
            .get(route("support.tickets.view", ticket.id))
            .then((res) => {
                const updatedChats = res.data.ticket?.chats || res.data.chats || [];
                setChatList(updatedChats);
                toast.success("Conversation updated");
            })
            .catch((err) => {
                console.error(err);
                toast.error("Failed to refresh chat");
            })
            .finally(() => {
                setIsRefreshing(false);
            });
    };

    /* -------------------------
        FILE SELECT (FIXED)
    --------------------------*/
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const maxSize = 10 * 1024 * 1024; // 10MB
        let errors = "";
        
        const newAttachments = [];

        files.forEach((file) => {
            if (file.size > maxSize) {
                errors = `${file.name} exceeds 10MB limit.`;
            } else {
                newAttachments.push({
                    file: file,
                    id: Math.random().toString(36).substring(7), // Unique ID
                    name: file.name,
                    preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
                    isImage: file.type.startsWith("image/")
                });
            }
        });

        if (errors) {
            setAttachmentErrors(errors);
            toast.error(errors);
        } else {
            setAttachmentErrors("");
            setPendingAttachments(prev => [...prev, ...newAttachments]);
        }

        // Reset input to allow re-selecting same file if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; 
        }
    };

    const removeAttachment = (idToRemove) => {
        setPendingAttachments((prev) => prev.filter((item) => item.id !== idToRemove));
    };

    /* -------------------------
        SEND REPLY
    --------------------------*/
    const sendReply = () => {
        if (!message.trim() && pendingAttachments.length === 0) {
            return setAttachmentErrors("Please enter message or attach files.");
        }

        setIsSending(true); // Start loading

        const formData = new FormData();
        formData.append("message", message);

        pendingAttachments.forEach((item) => {
            formData.append("attachments[]", item.file);
        });

        axios
            .post(route("support.tickets.reply", ticket.id), formData)
            .then(() => {
                toast.success("Reply sent");
                setMessage("");
                setPendingAttachments([]);
                setAttachmentErrors("");
                refresh();
            })
            .catch((e) => {
                console.error(e);
                toast.error("Failed to send reply");
            })
            .finally(() => {
                setIsSending(false); // Stop loading
            });
    };

    /* -------------------------
        DOWNLOAD ZIP
    --------------------------*/
    const downloadZip = (chatId) => {
        axios({
            url: route("support.tickets.downloadZip", chatId),
            method: "GET",
            responseType: "blob",
        }).then((res) => {
            let fileName = "attachments.zip";
            const disposition = res.headers["content-disposition"];

            if (disposition && disposition.includes("filename=")) {
                fileName = disposition.split("filename=")[1].replace(/"/g, "");
            }

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        });
    };

    /* -------------------------
        UPDATE TICKET STATUS
    --------------------------*/
    const updateStatus = (newStatus) => {
        setStatus(newStatus); 

        axios
            .post(route("support.tickets.status", ticket.id), {
                status: newStatus,
            })
            .then(() => {
                toast.success("Status updated");
            })
            .catch(() => {
                toast.error("Failed to update status");
                setStatus(ticket.status); 
            });
    };

    return (
        <div className="p-6">
            <Head title="Ticket Details" />

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Ticket Details
                </h1>

                <button
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 transition text-white rounded-lg shadow"
                    onClick={() => router.visit(route("support.tickets.index"))}
                >
                    ← Back to List
                </button>
            </div>

            <div className="bg-white shadow-lg rounded-xl p-6">
                {/* TICKET HEADER */}
                <h2 className="text-xl font-semibold text-blue-700 mb-4">
                    #{ticket.ticket_id} — {ticket.user?.name}
                </h2>

                {/* MASTER TICKET SECTION */}
                <div className="mb-6 bg-gray-50 border rounded-xl p-5 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-semibold">Subject:</span>{" "}
                            {ticket.subject}
                        </div>
                        <div>
                            <span className="font-semibold">Category:</span>{" "}
                            {ticket.category}
                        </div>
                        <div>
                            <span className="font-semibold">Priority:</span>{" "}
                            {ticket.priority}
                        </div>
                        <div>
                            <span className="font-semibold">Status:</span>
                            <select
                                value={status}
                                onChange={(e) => updateStatus(e.target.value)}
                                className="ml-2 border rounded-md px-2 py-1 text-xs bg-white
                                    focus:ring-2 focus:ring-blue-400 outline-none"
                            >
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>
                    </div>

                    {ticket.description && (
                        <div className="text-sm text-gray-700">
                            <span className="font-semibold block mb-1">
                                Description
                            </span>
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: ticket.description,
                                }}
                            />
                        </div>
                    )}

                    {ticket.attachment && (
                        <div className="text-sm">
                            <span className="font-semibold block mb-1">
                                Attachment
                            </span>
                            <a
                                href={ticket.attachment}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-blue-600 underline"
                            >
                                <FontAwesomeIcon icon={faFile} />
                                View Attachment
                            </a>
                        </div>
                    )}
                </div>

                {/* CONVERSATION SECTION */}
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-md font-semibold text-gray-700">
                        Conversation
                    </h3>
                    
                    <button 
                        onClick={refresh}
                        disabled={isRefreshing}
                        className={`
                            inline-flex items-center gap-2 px-3 py-1.5
                            text-sm font-medium
                            text-gray-600 bg-white
                            border border-gray-200 rounded-md
                            hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200
                            transition-all duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed
                            shadow-sm
                        `}
                        title={isRefreshing ? "Refreshing conversation…" : "Refresh conversation"}
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

                {/* CHAT WINDOW */}
                <div 
                    ref={chatContainerRef}
                    className="border rounded-xl p-4 bg-gray-50 min-h-[300px] max-h-[500px] overflow-y-auto space-y-5 scroll-smooth"
                >
                    {chatList.length === 0 && (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                            No messages yet.
                        </div>
                    )}

                    {chatList.map((msg) => {
                        const isAdmin = msg.sender_id !== ticket.user?.id;

                        return (
                            <div
                                key={msg.id}
                                className={`flex ${
                                    isAdmin ? "justify-end" : "justify-start"
                                }`}
                            >
                                <div
                                    className={`p-4 rounded-xl shadow-md max-w-[70%] ${
                                        isAdmin
                                            ? "bg-blue-600 text-white"
                                            : "bg-white border text-gray-700"
                                    }`}
                                >
                                    {/* TEXT MESSAGE */}
                                    {msg.message && (
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                            {msg.message}
                                        </p>
                                    )}

                                    {/* ATTACHMENTS */}
                                    {msg.attachment_urls?.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {/* ZIP BUTTON */}
                                            <button
                                                className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-2 shadow"
                                                onClick={() =>
                                                    downloadZip(msg.id)
                                                }
                                            >
                                                <FontAwesomeIcon
                                                    icon={faDownload}
                                                />
                                                Download All
                                            </button>

                                            {/* FILE LIST */}
                                            {msg.attachment_urls.map(
                                                (file, i) => (
                                                    <a
                                                        key={i}
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`flex items-center gap-2 underline text-xs transition ${
                                                            isAdmin ? "text-blue-100 hover:text-white" : "hover:text-blue-900"
                                                        }`}
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faFile}
                                                            className="text-sm"
                                                        />
                                                        {file.name}
                                                    </a>
                                                )
                                            )}
                                        </div>
                                    )}

                                    {/* FOOTER */}
                                    <div className={`flex items-center gap-2 mt-2 text-xs opacity-80 ${
                                        isAdmin ? "text-blue-100" : "text-gray-500"
                                    }`}>
                                        <FontAwesomeIcon icon={faUser} />
                                        <span>
                                            {msg.sender?.name || (isAdmin ? "Support" : "User")}
                                        </span>
                                        <span>•</span>
                                        <span>
                                            {dayjs(msg.created_at).format("hh:mm A")}
                                        </span>
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* REPLY SECTION */}
                <div className="mt-6 pt-4 border-t flex flex-col gap-4">
                    
                    {/* PREVIEW AREA (Above Input) */}
                    {pendingAttachments.length > 0 && (
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {pendingAttachments.map((item) => (
                                <div key={item.id} className="relative w-16 h-16 shrink-0 rounded-lg border bg-gray-50 overflow-hidden group">
                                    {item.isImage ? (
                                        <img src={item.preview} alt="preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-1">
                                            <FontAwesomeIcon icon={faFile} className="text-xl mb-1" />
                                            <span className="text-[8px] text-center w-full truncate px-1">{item.name}</span>
                                        </div>
                                    )}
                                    
                                    {/* Remove Button */}
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(item.id)}
                                        className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition backdrop-blur-sm"
                                    >
                                        <FontAwesomeIcon icon={faTimesCircle} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <div className="relative w-full">
                            <textarea
                                className="border rounded-lg px-3 py-2 w-full pr-12 focus:ring-2 focus:ring-blue-400 outline-none"
                                rows="2"
                                placeholder="Type your reply..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            ></textarea>

                            <label className="absolute right-3 bottom-3 cursor-pointer text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition">
                                <input
                                    type="file"
                                    className="hidden"
                                    multiple
                                    onChange={handleFileChange}
                                    ref={fileInputRef}
                                />
                                <FontAwesomeIcon
                                    icon={faPaperclip}
                                    className="text-lg"
                                />
                            </label>
                        </div>

                        <button
                            onClick={sendReply}
                            disabled={isSending}
                            className={`px-6 py-2 rounded-lg shadow text-white font-medium flex items-center gap-2 transition ${
                                isSending ? 'bg-blue-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                            }`}
                        >
                            {isSending ? <FontAwesomeIcon icon={faSpinner} spin /> : "Send"}
                        </button>
                    </div>
                </div>

                {attachmentErrors && (
                    <p className="text-red-500 text-sm mt-2">
                        {attachmentErrors}
                    </p>
                )}
            </div>
        </div>
    );
}