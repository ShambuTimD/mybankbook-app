import React from "react";
import { Link, usePage, Head, router } from "@inertiajs/react";
import { Bell, CheckCircle, ArrowLeft } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function NotificationIndex() {
  const { notifications } = usePage().props;
  const list = notifications.data || [];

  // --- ACTIONS ---

  // Handle Back Navigation based on session origin
  const handleBack = () => {
    const origin = sessionStorage.getItem("notification_back_origin");

    if (origin === "booking") {
      sessionStorage.setItem("korpheal_is_dashboard", "false");
      window.dispatchEvent(new Event("storage"));
      // Adjust this route to match your booking wizard route
      router.visit("/f/brand-self-appointment"); 
    } else {
      sessionStorage.setItem("korpheal_is_dashboard", "true");
      window.dispatchEvent(new Event("storage"));
      router.visit("/f/dashboard");
    }
  };

  // Mark single as read
  const markAsRead = (id) => {
    router.post(
      route("notification.mark-read", id),
      {},
      { preserveScroll: true, preserveState: true }
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    router.post(
      route("notification.mark-all-read"),
      {},
      { preserveScroll: true }
    );
  };

  return (
    <>
      <Head title="Notifications" />

      {/* Full Page Width Container */}
      <div className="w-full min-h-screen bg-gray-50 p-6">
        
        {/* === 1. HEADER SECTION === */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          {/* Title */}
          <h1 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
            <span className="bg-blue-100 text-blue-600 w-10 h-10 flex items-center justify-center rounded-full shadow-sm">
              <Bell className="h-5 w-5" />
            </span>
            Notifications
          </h1>

          {/* Back Button */}
          <div>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        </div>

        {/* === 2. ACTION BUTTONS (Mark All Read Only) === */}
        {list.length > 0 && (
          <div className="flex justify-end gap-3 mb-4">
            <button
              onClick={markAllAsRead}
              className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Mark All Read
            </button>
          </div>
        )}

        {/* === 3. NOTIFICATION LIST === */}
        <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-200 w-full">
          {list.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-500">
              <div className="bg-gray-100 p-4 rounded-full mb-3">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-lg">No notifications found.</p>
            </div>
          ) : (
            <div>
              {list.map((item) => (
                <div
                  key={item.id}
                  className={`px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start gap-4 transition duration-150 ${
                    item.is_read === "unread"
                      ? "bg-blue-50/60 hover:bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {/* Content Side */}
                  <div className="flex-1">
                    <p
                      className={`text-gray-800 ${
                        item.is_read === "unread"
                          ? "font-semibold"
                          : "font-medium"
                      }`}
                    >
                      {item.message}
                    </p>

                    {item.long_content && (
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        {item.long_content}
                      </p>
                    )}

                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      {item.date_time
                        ? dayjs(item.date_time).fromNow()
                        : "Just now"}
                      <span className="w-1 h-1 bg-gray-300 rounded-full mx-1"></span>
                      {item.date_time
                        ? dayjs(item.date_time).format("DD MMM YYYY, hh:mm A")
                        : ""}
                    </p>
                  </div>

                  {/* Actions Side (Mark Read Button / Read Status) */}
                  <div className="flex items-center gap-3 shrink-0">
                    {item.is_read === "unread" ? (
                      <button
                        onClick={() => markAsRead(item.id)}
                        className="text-xs px-3 py-1.5 bg-white border border-yellow-200 text-yellow-700 rounded-md hover:bg-yellow-50 flex items-center gap-1 shadow-sm transition"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Mark Read
                      </button>
                    ) : (
                      <span className="text-xs text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded border border-green-100">
                        <CheckCircle className="h-3 w-3" />
                        Read
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* === 4. PAGINATION === */}
        {notifications.links?.length > 3 && (
          <div className="mt-6 flex justify-center space-x-2">
            {notifications.links.map((link, idx) => (
              <Link
                key={idx}
                href={link.url || "#"}
                className={`px-3 py-1 rounded text-sm border ${
                  link.active
                    ? "bg-blue-600 text-white border-blue-600"
                    : "text-gray-700 hover:bg-gray-100 border-gray-300"
                } ${!link.url ? "pointer-events-none opacity-50" : ""}`}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}