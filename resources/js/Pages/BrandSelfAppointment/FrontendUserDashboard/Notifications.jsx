//With delete Functionality
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { router } from "@inertiajs/react";
// import dayjs from "dayjs";
// import relativeTime from "dayjs/plugin/relativeTime";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { 
//     faBell, 
//     faCheckCircle, 
//     faArrowLeft, 
//     faSpinner, // Added Spinner
//     faTrash
// } from "@fortawesome/free-solid-svg-icons";

// dayjs.extend(relativeTime);

// export default function Notification() {
//   const [notifications, setNotifications] = useState([]);
//   const [loading, setLoading] = useState(false);

//   // Load token
//   const userData = JSON.parse(sessionStorage.getItem("session_user") || "{}");
//   const token = userData?.token || "";

//   const axiosConfig = {
//     headers: { Authorization: `Bearer ${token}` },
//     withCredentials: true,
//   };

//   /* -----------------------------------------------------
//       FETCH NOTIFICATIONS
//   ----------------------------------------------------- */
//   const fetchNotifications = async () => {
//     setLoading(true);
//     try {
//       const res = await axios.get(route("notification.list"), axiosConfig);

//       if (res.data.success) {
//         setNotifications(res.data.data || []);
//       }
//     } catch (err) {
//       console.error("Fetch Error:", err.response?.data || err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchNotifications();
//   }, []);

//   /* -----------------------------------------------------
//       MARK SINGLE READ
//   ----------------------------------------------------- */
//   const markAsRead = async (id) => {
//     try {
//       await axios.post(route("notification.update", id), {}, axiosConfig);
//       fetchNotifications();
//     } catch (err) {
//       console.error("Mark read error:", err);
//     }
//   };

//   /* -----------------------------------------------------
//       MARK ALL READ
//   ----------------------------------------------------- */
//   const markAllAsRead = async () => {
//     try {
//       await Promise.all(
//         notifications
//           .filter((n) => n.is_read === "unread")
//           .map((n) =>
//             axios.post(route("notification.update", n.id), {}, axiosConfig)
//           )
//       );
//       fetchNotifications();
//     } catch (err) {
//       console.error("Mark all read error:", err);
//     }
//   };

//   /* -----------------------------------------------------
//       DELETE SINGLE NOTIFICATION
//   ----------------------------------------------------- */
//   const deleteNotification = async (id) => {
//     if (!window.confirm("Delete this notification?")) return;

//     try {
//       await axios.delete(route("notification.delete", id), axiosConfig);
//       fetchNotifications();
//     } catch (err) {
//       console.error("Delete error:", err);
//     }
//   };

//   /* -----------------------------------------------------
//       DELETE ALL NOTIFICATIONS
//   ----------------------------------------------------- */
//   const deleteAllNotifications = async () => {
//     if (!window.confirm("Delete ALL notifications?")) return;

//     try {
//       await axios.delete(route("notification.deleteAll"), axiosConfig);
//       fetchNotifications();
//     } catch (err) {
//       console.error("Delete all error:", err);
//     }
//   };

//   /* -----------------------------------------------------
//       HANDLE BACK BUTTON
//   ----------------------------------------------------- */
//   const handleBack = () => {
//     const origin = sessionStorage.getItem("notification_back_origin");

//     if (origin === "booking") {
//       sessionStorage.setItem("korpheal_is_dashboard", "false");
//       window.dispatchEvent(new Event("storage"));
//       router.visit("/f/self-booking");
//     } else {
//       sessionStorage.setItem("korpheal_is_dashboard", "true");
//       router.visit("/f/dashboard");
//     }
//   };

//   /* =====================================================
//       JSX RENDER
//   ===================================================== */
//   return (
//     // Changed to full width and added gray background
//     <div className="w-full min-h-screen bg-gray-50 p-6">
      
//       {/* Top Header Section */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        
//         {/* Left Side: Title */}
//         <h1 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
//           <span className="bg-blue-100 text-blue-600 w-10 h-10 flex items-center justify-center rounded-full text-lg shadow-sm">
//              <FontAwesomeIcon icon={faBell} />
//           </span>
//           Notifications
//         </h1>

//         {/* Right Side: Back Button (Highlighted Section) */}
//         <div className="flex items-center gap-3">
//             <button
//                 onClick={handleBack}
//                 className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium text-sm"
//                 title="Go Back"
//             >
//                 <FontAwesomeIcon icon={faArrowLeft} />
//                 Back
//             </button>
//         </div>
//       </div>

//       {/* Action Buttons Row (Mark All / Delete All) */}
//       {notifications.length > 0 && !loading && (
//         <div className="flex justify-end gap-3 mb-4">
//             <button
//             onClick={markAllAsRead}
//             className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition"
//             >
//             <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
//             Mark All Read
//             </button>

//             <button
//             onClick={deleteAllNotifications}
//             className="text-sm px-4 py-2 bg-white text-red-600 border border-red-200 rounded-md hover:bg-red-50 shadow-sm transition"
//             >
//             <FontAwesomeIcon icon={faTrash} className="mr-2" />
//             Delete All
//             </button>
//         </div>
//       )}

//       {/* Notification List Container */}
//       <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-200 w-full">
//         {loading ? (
//           /* Loading State (from reference code) */
//           <div className="text-center py-12">
//             <FontAwesomeIcon
//               icon={faSpinner}
//               spin
//               className="text-3xl text-indigo-600"
//             />
//             <p className="text-gray-500 mt-3 font-medium">
//               Loading notifications...
//             </p>
//           </div>
//         ) : notifications.length === 0 ? (
//           /* Empty State */
//           <div className="flex flex-col items-center py-16 text-gray-500">
//             <div className="bg-gray-100 p-4 rounded-full mb-3">
//                 <FontAwesomeIcon icon={faBell} className="text-3xl text-gray-400" />
//             </div>
//             <p className="text-lg">No notifications found.</p>
//           </div>
//         ) : (
//           /* List Items */
//           notifications.map((item) => (
//             <div
//               key={item.id}
//               className={`px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start gap-4 transition duration-150 ${
//                 item.is_read === "unread"
//                   ? "bg-blue-50/60 hover:bg-blue-50"
//                   : "hover:bg-gray-50"
//               }`}
//             >
//               <div className="flex-1">
//                 <p className={`text-gray-800 ${item.is_read === 'unread' ? 'font-semibold' : 'font-medium'}`}>
//                     {item.message}
//                 </p>

//                 {item.long_content && (
//                   <p className="text-sm text-gray-600 mt-1 leading-relaxed">
//                     {item.long_content}
//                   </p>
//                 )}

//                 <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
//                   {dayjs(item.date_time).fromNow()} 
//                   <span className="w-1 h-1 bg-gray-300 rounded-full mx-1"></span>
//                   {dayjs(item.date_time).format("DD MMM YYYY, hh:mm A")}
//                 </p>
//               </div>

//               <div className="flex items-center gap-3 shrink-0">
//                 {item.is_read === "unread" ? (
//                   <button
//                     onClick={() => markAsRead(item.id)}
//                     className="text-xs px-3 py-1.5 bg-white border border-yellow-200 text-yellow-700 rounded-md hover:bg-yellow-50 flex items-center gap-1 shadow-sm transition"
//                     title="Mark as Read"
//                   >
//                     <FontAwesomeIcon icon={faCheckCircle} />
//                     Mark Read
//                   </button>
//                 ) : (
//                   <span className="text-xs text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded border border-green-100">
//                     <FontAwesomeIcon icon={faCheckCircle} />
//                     Read
//                   </span>
//                 )}

//                 <button
//                   onClick={() => deleteNotification(item.id)}
//                   className="text-xs px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-md hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm transition"
//                   title="Delete"
//                 >
//                   <FontAwesomeIcon icon={faTrash} />
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }
import React, { useEffect, useState } from "react";
import axios from "axios";
import { router } from "@inertiajs/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faBell, 
    faCheckCircle, 
    faArrowLeft, 
    faSpinner
} from "@fortawesome/free-solid-svg-icons";

dayjs.extend(relativeTime);

export default function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const userData = JSON.parse(sessionStorage.getItem("session_user") || "{}");
  const token = userData?.token || "";

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  };

  /* -----------------------------------------------------
      FETCH NOTIFICATIONS
  ----------------------------------------------------- */
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get(route("notification.list"), axiosConfig);

      if (res.data.success) {
        setNotifications(res.data.data || []);
      }
    } catch (err) {
      console.error("Fetch Error:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  /* -----------------------------------------------------
      MARK SINGLE READ
  ----------------------------------------------------- */
  const markAsRead = async (id) => {
    try {
      await axios.post(route("notification.update", id), {}, axiosConfig);
      fetchNotifications();
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  /* -----------------------------------------------------
      MARK ALL READ
  ----------------------------------------------------- */
  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter((n) => n.is_read === "unread")
          .map((n) =>
            axios.post(route("notification.update", n.id), {}, axiosConfig)
          )
      );
      fetchNotifications();
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  /* -----------------------------------------------------
      HANDLE BACK BUTTON
  ----------------------------------------------------- */
  const handleBack = () => {
    const origin = sessionStorage.getItem("notification_back_origin");

    if (origin === "booking") {
      sessionStorage.setItem("korpheal_is_dashboard", "false");
      window.dispatchEvent(new Event("storage"));
      router.visit("/f/self-booking");
    } else {
      sessionStorage.setItem("korpheal_is_dashboard", "true");
      router.visit("/f/dashboard");
    }
  };

  /* =====================================================
      JSX RENDER
  ===================================================== */
  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">

      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        
        {/* Title */}
        <h1 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
          <span className="bg-blue-100 text-blue-600 w-10 h-10 flex items-center justify-center rounded-full text-lg shadow-sm">
             <FontAwesomeIcon icon={faBell} />
          </span>
          Notifications
        </h1>

        {/* Back Button */}
        <div className="flex items-center gap-3">
            <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium text-sm"
            >
                <FontAwesomeIcon icon={faArrowLeft} />
                Back
            </button>
        </div>
      </div>

      {/* Mark All Read */}
      {notifications.length > 0 && !loading && (
        <div className="flex justify-end gap-3 mb-4">
            <button
                onClick={markAllAsRead}
                className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition"
            >
                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                Mark All Read
            </button>
        </div>
      )}

      {/* Notification List */}
      <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-200 w-full">

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12">
            <FontAwesomeIcon
              icon={faSpinner}
              spin
              className="text-3xl text-indigo-600"
            />
            <p className="text-gray-500 mt-3 font-medium">
              Loading notifications...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          
          /* Empty State */
          <div className="flex flex-col items-center py-16 text-gray-500">
            <div className="bg-gray-100 p-4 rounded-full mb-3">
                <FontAwesomeIcon icon={faBell} className="text-3xl text-gray-400" />
            </div>
            <p className="text-lg">No notifications found.</p>
          </div>
          
        ) : (
          
          /* Notification List */
          notifications.map((item) => (
            <div
              key={item.id}
              className={`px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start gap-4 transition duration-150 ${
                item.is_read === "unread"
                  ? "bg-blue-50/60 hover:bg-blue-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex-1">
                <p className={`text-gray-800 ${item.is_read === 'unread' ? 'font-semibold' : 'font-medium'}`}>
                    {item.message}
                </p>

                {item.long_content && (
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    {item.long_content}
                  </p>
                )}

                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  {dayjs(item.date_time).fromNow()} 
                  <span className="w-1 h-1 bg-gray-300 rounded-full mx-1"></span>
                  {dayjs(item.date_time).format("DD MMM YYYY, hh:mm A")}
                </p>
              </div>

              {/* Mark Read ONLY (Delete removed) */}
              <div className="flex items-center gap-3 shrink-0">
                {item.is_read === "unread" ? (
                  <button
                    onClick={() => markAsRead(item.id)}
                    className="text-xs px-3 py-1.5 bg-white border border-yellow-200 text-yellow-700 rounded-md hover:bg-yellow-50 flex items-center gap-1 shadow-sm transition"
                  >
                    <FontAwesomeIcon icon={faCheckCircle} />
                    Mark Read
                  </button>
                ) : (
                  <span className="text-xs text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded border border-green-100">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    Read
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
