import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

const ViewBookingModal = ({ open, data, onClose }) => {
    const userData = JSON.parse(sessionStorage.getItem("session_user") || "{}");
    const token = userData?.token;

    if (!open || !data) return null;

    const bookingId = data;
    const [bookingData, setBookingData] = useState("");
    const [loading, setLoading] = useState(true);

    // Disable page scroll when modal is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden"; // stop page scroll
        } else {
            document.body.style.overflow = "auto"; // restore scroll
        }

        return () => {
            document.body.style.overflow = "auto"; // cleanup
        };
    }, [open]);

    // Format status text
    const formatStatus = (text) => {
        if (!text) return "-";
        return text
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/^\w/, (c) => c.toUpperCase());
    };

    const getStatusBadge = (status, isHold = 0) => {
        if (!status) return "bg-gray-100 text-gray-700";

        // If booking is on hold
        if (isHold == 1) {
            return "bg-red-600 text-white";
        }

        const map = {
            pending: "bg-yellow-100 text-yellow-700",
            confirmed: "bg-blue-100 text-blue-700",
            attended: "bg-green-100 text-green-700",
            cancelled: "bg-red-100 text-red-700",
            no_show: "bg-gray-100 text-gray-700",
        };

        return map[status.toLowerCase()] || "bg-gray-100 text-gray-700";
    };
    const fetchBookingDetails = async (id) => {
        if (!id) return;
        setLoading(true);

        try {
            // Note: Ensure 'route' is available in your scope (e.g. from Ziggy)
            // If route is not defined globally, replace with standard URL string
            const res = await axios.get(route("frontbooking.show", id), {
                headers: { Authorization: `Bearer ${token}` },
            });

            setBookingData(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookingDetails(bookingId);
    }, [bookingId]);

    const details = bookingData.details || [];

    // Loading overlay
    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
                <div className="bg-white p-6 rounded-lg shadow text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-3"></div>
                    <p className="text-gray-700 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-lg w-[900px] max-h-[90vh] overflow-y-auto">

                {/* HEADER (sticky) */}
                <div className="flex items-center justify-between py-4 border-b sticky top-0 bg-white z-20">

                    {/* Left: Title */}
                    <div className="bg-blue-600 rounded-r-full pl-4 pr-6 py-2 shadow-md">
                        <h3 className="text-lg font-normal text-white">
                            Booking Details - #{bookingData.brn}
                        </h3>
                    </div>

                    {/* Right: Status Badge & Close Button */}
                    <div className="flex items-center gap-4 pr-2">
                        {/* --- MOVED STATUS BADGE HERE --- */}
                        <span
                            className={`px-3 py-1 rounded-full text-sm font-normal shadow-sm ${getStatusBadge(
                                bookingData.booking_status,
                                bookingData.is_hold
                            )}`}
                        >
                            {formatStatus(bookingData.booking_status)}
                            {bookingData.is_hold == 1 && " – Hold"}
                        </span>

                        <button onClick={onClose}>
                            <FontAwesomeIcon
                                icon={faTimes}
                                className="text-gray-500 hover:text-gray-700 px-5 text-lg"
                            />
                        </button>
                    </div>
                </div>

                {/* MASTER DATA */}
                <div className="px-5 py-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="font-normal text-gray-700 pb-2">Company</p>
                        <p className="text-gray-900">
                            {bookingData.company?.name}
                        </p>
                    </div>

                    <div className="mt-2">
                        <p className="font-normal text-gray-700 pb-2">Office</p>
                        <p className="text-gray-900">
                            {bookingData.office?.office_name}
                        </p>
                    </div>

                    <div className="mt-2">
                        <p className="font-normal text-gray-700 pb-2">Appointment Date</p>
                        <p className="text-gray-900">
                            {bookingData.pref_appointment_date
                                ? moment(bookingData.pref_appointment_date).format("DD-MM-YYYY")
                                : "-"}
                        </p>
                    </div>

                    {/* --- REMOVED STATUS FROM HERE --- */}
                    <div className="mt-2">
                        <p className="font-normal text-gray-700 pb-2">Remarks</p>
                        <p className="text-gray-900">
                            {bookingData.status_remarks || "-"}
                        </p>
                    </div>


                    <div className="mt-2">
                        <p className="font-normal text-gray-700 pb-2">Requested By</p>
                        <p className="text-gray-900">
                            {bookingData.requested_by?.name} ({bookingData.requested_by?.phone})
                        </p>
                    </div>

                    <div className="mt-2">
                        <p className="font-normal text-gray-700 pb-2">Created On</p>
                        <p className="text-gray-900">
                            {moment(bookingData.created_on).format("DD-MM-YYYY HH:mm")}
                        </p>
                    </div>
                </div>

                {/* DETAILS TABLE */}
                <div className="p-5">
                    <h3 className="text-md font-normal mb-3">Applicants</h3>

                    <div className="overflow-x-auto">
                        <table className="min-w-full border text-sm">
                            <thead className="bg-gray-100 sticky top-[0px] z-10">
                                <tr>
                                    <th className="border px-3 py-2 text-left font-normal">UARN</th>
                                    <th className="border px-3 py-2 text-left font-normal">Name</th>
                                    <th className="border px-3 py-2 text-left font-normal">Type</th>
                                    <th className="border px-3 py-2 text-left font-normal">Phone</th>
                                    <th className="border px-3 py-2 text-left font-normal">Status</th>
                                    <th className="border px-3 py-2 text-left font-normal">Status updated on</th>
                                    <th className="border px-3 py-2 text-left font-normal">Report Status</th>
                                </tr>
                            </thead>


                            <tbody>
                                {details.map((d) => (
                                    <tr key={d.id} className="hover:bg-gray-50">
                                        <td className="border px-3 py-2 font-mono">{d.uarn}</td>
                                        <td className="border px-3 py-2">{d.full_name}</td>
                                        <td className="border px-3 py-2">{formatStatus(d.applicant_type)}</td>
                                        <td className="border px-3 py-2">{d.phone}</td>
                                        <td className="border px-3 py-2">{formatStatus(d.status)}</td>
                                        <td className="border px-3 py-2">{formatStatus(d.status_updated_on)}</td>
                                        <td className="border px-3 py-2">{formatStatus(d.report_status || "Not started")}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ViewBookingModal;
