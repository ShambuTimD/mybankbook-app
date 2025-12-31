import React from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import moment from "moment";
import toast from "react-hot-toast";

const DownloadBookingReportModal = ({ open, booking, onClose }) => {
    if (!open || !booking) return null;

    const handleExport = (type) => {
        try {
            const exportData = [
                {
                    "Booking ID": booking.id,
                    BRN: booking.brn,
                    Company: booking.company?.name || "-",
                    Office: booking.office?.office_name || "-",
                    Status: booking.booking_status || "-",
                    "Preferred Date": booking.pref_appointment_date
                        ? moment(booking.pref_appointment_date).format("DD-MM-YYYY")
                        : "-",
                    "Total Employees": booking.total_employees || 0,
                    "Total Dependents": booking.total_dependents || 0,
                    "Created On": moment(booking.created_on).format("DD-MM-YYYY HH:mm"),
                    Notes: booking.notes || "-",
                },
            ];

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Booking Report");

            const fileName = `Booking_Report_${booking.brn}_${moment().format(
                "YYYY-MM-DD"
            )}.${type}`;

            if (type === "csv") {
                const csv = XLSX.utils.sheet_to_csv(worksheet);
                saveAs(
                    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
                    fileName
                );
            } else {
                const buffer = XLSX.write(workbook, {
                    bookType: "xlsx",
                    type: "array",
                });
                saveAs(
                    new Blob([buffer], {
                        type:
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    }),
                    fileName
                );
            }

            toast.success(`Booking report exported (${type.toUpperCase()})`);
            onClose();
        } catch (e) {
            console.error(e);
            toast.error("Failed to export booking report");
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">
                        Download Booking Report
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    <p className="text-sm text-gray-600">
                        Booking Reference:{" "}
                        <span className="font-medium">{booking.brn}</span>
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={() => handleExport("csv")}
                            className="flex-1 px-4 py-2 rounded-md border text-sm font-medium hover:bg-gray-100"
                        >
                            Download CSV
                        </button>

                        <button
                            onClick={() => handleExport("xlsx")}
                            className="flex-1 px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                        >
                            Download Excel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DownloadBookingReportModal;
