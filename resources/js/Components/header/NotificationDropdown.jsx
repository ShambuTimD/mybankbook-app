import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom"; // Import createPortal
import { Link } from "@inertiajs/react";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";

// Extend DayJS with the relativeTime plugin
dayjs.extend(relativeTime);

export default function NotificationDropdown() {
    const [open, setOpen] = useState(false);
    const [list, setList] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // State for positioning the dropdown
    const [position, setPosition] = useState({ top: 0, left: 0 });
    
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    // Fetch Notifications
    const loadNotifications = async () => {
        try {
            // Ensure this route matches your API
            const res = await axios.get(route("notification.fetch")); 
            const data = res.data || [];

            const formatted = data.map((n) => ({
                ...n,
                human_time: n.date_time ? dayjs(n.date_time).fromNow() : "Just now",
            }));

            setList(formatted);

            const unread = formatted.filter(
                (n) => n.is_read === "unread" || n.is_read === 0 || n.is_read === false
            ).length;
            
            setUnreadCount(unread);

        } catch (err) {
            console.error("Notification Fetch Error:", err);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    // Toggle Dropdown & Calculate Position
    const toggleDropdown = () => {
        setOpen((prev) => !prev);
    };

    // Recalculate position when opened or scrolled
    useEffect(() => {
        if (!open || !buttonRef.current) return;

        const updatePosition = () => {
            const rect = buttonRef.current.getBoundingClientRect();
            const dropdownWidth = 360; // Width of our dropdown
            
            setPosition({
                top: rect.bottom + 10, // 10px below the button
                // Align the right edge of dropdown with right edge of button
                left: rect.right - dropdownWidth, 
            });
        };

        updatePosition();
        
        // Update on scroll or resize to keep it attached
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);
        
        // Refresh data when opening
        loadNotifications();

        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [open]);

    // Close on click outside
    useEffect(() => {
        const clickHandler = (e) => {
            // Check if click is outside BOTH the button and the portal dropdown
            if (
                dropdownRef.current && 
                !dropdownRef.current.contains(e.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", clickHandler);
        return () => document.removeEventListener("mousedown", clickHandler);
    }, []);

    return (
        <>
            {/* === Bell Button === */}
            <button
                ref={buttonRef}
                onClick={toggleDropdown}
                className="relative flex items-center justify-center text-gray-500 bg-white border border-gray-200 rounded-full h-11 w-11 hover:bg-gray-100 transition"
            >
                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center shadow-lg z-10">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}

                <FontAwesomeIcon icon={faBell} className="text-gray-700 text-lg" />
            </button>

            {/* === Portal Dropdown === */}
            {open && createPortal(
                <div 
                    ref={dropdownRef}
                    className="fixed rounded-2xl border border-gray-200 bg-white p-3 shadow-xl z-[9999]"
                    style={{
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                        width: "360px"
                    }}
                >
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                        <h4 className="text-lg font-semibold text-gray-800">Notifications</h4>
                    </div>

                    <ul className="flex flex-col max-h-[420px] overflow-y-auto custom-scrollbar">
                        {list.length === 0 ? (
                            <li className="text-center text-gray-500 py-4">
                                No notifications found.
                            </li>
                        ) : (
                            list.map((n) => (
                                <li
                                    key={n.id}
                                    className="flex gap-3 items-start py-3 px-2 rounded-lg hover:bg-gray-50 transition border-b border-gray-100 last:border-none cursor-pointer"
                                >
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-700 leading-tight">
                                            {n.message}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {n.human_time}
                                        </p>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>

                    {/* Footer Button */}
                    <Link
                        href={route("notification.index")}
                        className="block w-full text-center border rounded-lg py-2 mt-3 hover:bg-gray-100 transition text-sm font-medium text-gray-700"
                        onClick={() => setOpen(false)}
                    >
                        View All Notifications
                    </Link>
                </div>,
                document.body // Render directly into the body
            )}
        </>
    );
}