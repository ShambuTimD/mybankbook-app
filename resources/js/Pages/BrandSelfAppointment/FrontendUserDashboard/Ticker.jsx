import React, { useEffect, useState } from "react";
import axios from "axios";
import { router } from "@inertiajs/react"; // ✅ Import Inertia router

const Ticker = ({ officeIds = [] }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userData = JSON.parse(sessionStorage.getItem("session_user") || "{}");
        const token = userData?.token || "";

        const res = await axios.get(route("notification.list"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });

        if (res.data?.success && Array.isArray(res.data.data)) {
          return
          const notifications = res.data.data.map((n) => ({
            message: n.message,
            long_content: n.long_content,
            time: n.date_time,
          }));

          setItems(notifications.sort((a, b) => new Date(b.time) - new Date(a.time)));
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error("Ticker fetch error:", err);
      }
    };

    fetchNotifications();

    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [officeIds]);

  // ✅ Route target (auto works on localhost + production)
const redirectUrl = `${window.location.origin}/f/self-booking?section=notifications`;


  // ✅ Navigate without leaving the Inertia app
  const handleClick = (e) => {
    e.preventDefault();
    router.visit(redirectUrl); // Inertia-style navigation (no page reload)
  };

  return (
    <div className="w-full bg-blue-50 border-b py-2 overflow-hidden">
      <div className="ticker-wrapper whitespace-nowrap animate-marquee hover:[animation-play-state:paused]">
        {items.length > 0 ? (
          items.map((item, i) => (
            <a
              key={i}
              href={redirectUrl}
              onClick={handleClick}
              className="inline-block mx-6 text-blue-700 hover:underline cursor-pointer"
              title={item.long_content || item.message}
            >
              {item.message}
            </a>
          ))
        ) : (
          <span className="inline-block mx-6 text-gray-500">
            {/* No notifications available */}
          </span>
        )}
      </div>

      <style jsx>{`
        .animate-marquee {
          display: inline-block;
          min-width: 100%;
          animation: marquee 25s linear infinite;
        }
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
};

export default Ticker;
