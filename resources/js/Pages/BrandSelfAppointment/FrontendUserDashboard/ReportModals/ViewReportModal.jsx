import React, { useEffect } from "react";

import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faFilePdf, faEye } from "@fortawesome/free-solid-svg-icons";

const ViewReportModal = ({ open, data, onClose }) => {
    if (!open || !data) return null;
    console.log("ViewReportModal data:", data);


    useEffect(() => {
        if (open) {
            // Lock background scroll
            document.body.style.overflow = "hidden";
        } else {
            // Restore scroll
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);


    // --- Helpers ---
    const getStatusBadge = (status) => { /* ... existing helper ... */ };
    const formatText = (v) => v ? v.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : "-";

    const formatCombinedStatus = (status, reportStatus) => {
        const clean = (str) => {
            if (!str) return null;
            return str.replace(/_/g, " ").trim().toLowerCase().replace(/^./, (c) => c.toUpperCase());
        };
        const s = clean(status);
        const r = clean(reportStatus);

        if (status?.toLowerCase() === "cancelled") return s || "Cancelled";
        if (!s && !r) return "N/A";
        return `${s || "N/A"} – ${r || "N/A"}`;
    };

    const getCombinedBadgeClass = (status) => {
        if (!status) return "bg-gray-100 text-gray-700 border border-gray-300";
        const map = {
            attended: "bg-green-100 text-green-700 border border-green-300",
            scheduled: "bg-blue-100 text-blue-700 border border-blue-300",
            pending: "bg-yellow-100 text-yellow-700 border border-yellow-300",
            cancelled: "bg-red-100 text-red-700 border border-red-300",
            not_started: "bg-gray-100 text-gray-700 border border-gray-300",
        };
        return map[status] || "bg-gray-100 text-gray-700 border border-gray-300";
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg shadow-lg w-[900px] max-h-[90vh] overflow-y-auto flex flex-col">

                {/* HEADER (Sticky Top) */}
                <div className="flex items-center justify-between py-4 border-b sticky top-0 bg-white z-20 px-4">
                    <div className="bg-blue-600 rounded-r-full pl-4 pr-6 py-2 shadow-md -ml-4">
                        <h3 className="text-lg font-normal text-white">
                            Report Details - #{data.brn}
                        </h3>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className={"px-3 py-1 rounded-full text-sm font-medium shadow-sm " + getCombinedBadgeClass(data.status)}>
                            {formatCombinedStatus(data.status, data.report_status)}
                        </span>
                        <button onClick={onClose}>
                            <FontAwesomeIcon icon={faTimes} className="text-gray-500 hover:text-gray-700 text-lg" />
                        </button>
                    </div>
                </div>

                {/* SCROLLABLE CONTENT AREA */}
                <div className="p-5 overflow-y-auto">

                    {/* 1. Applicant Details Grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm mb-6">
                        <div>
                            <p className="font-normal text-gray-500 mb-1">Full Name</p>
                            <p className="font-medium text-gray-900">{data.full_name || "-"}</p>
                        </div>
                        <div>
                            <p className="font-normal text-gray-500 mb-1">Email</p>
                            <p className="font-medium text-gray-900">{data.email || "-"}</p>
                        </div>
                        <div>
                            <p className="font-normal text-gray-500 mb-1">Phone</p>
                            <p className="font-medium text-gray-900">{data.phone || "-"}</p>
                        </div>
                        <div>
                            <p className="font-normal text-gray-500 mb-1">UARN</p>
                            <p className="font-medium text-gray-900">{data.uarn || "-"}</p>
                        </div>
                        <div>
                            <p className="font-normal text-gray-500 mb-1">Booking ID</p>
                            <p className="font-medium text-gray-900">#{data.booking_id || "-"}</p>
                        </div>
                        <div>
                            <p className="font-normal text-gray-500 mb-1">Report Updated On</p>
                            <p className="font-medium text-gray-900">
                                {data.report_uploaded_on
                                    ? moment(data.report_uploaded_on).format("DD-MM-YYYY HH:mm")
                                    : "-"}
                            </p>
                        </div>
                    </div>

                    {/* 2. Uploaded Reports Section */}
                    <div className="border-t pt-5">
                        <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilePdf} className="text-red-500" />
                            Uploaded Reports
                        </h4>

                        {data.reports && data.reports.length > 0 ? (
                            <div className="border rounded-lg overflow-hidden shadow-sm">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.reports.map((report, index) => (
                                            <tr key={report.media_id || index} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                                    {report.test_name || "-"}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {report.category_name || "-"}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600 max-w-[220px]">
                                                    {report.notes ? (
                                                        <div
                                                            className="line-clamp-2"
                                                            dangerouslySetInnerHTML={{ __html: report.notes }}
                                                        />
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-sm text-right">
                                                    <a
                                                        href={report.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
                                                    >
                                                        <FontAwesomeIcon icon={faEye} />
                                                        View
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <p className="text-gray-500 text-sm">No reports uploaded for this applicant yet.</p>
                            </div>
                        )}
                    </div>

                </div>

                {/* FOOTER */}
                <div className="px-5 py-3 border-t bg-gray-50 text-right rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 font-normal shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewReportModal;