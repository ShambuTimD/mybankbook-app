import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faEye } from "@fortawesome/free-solid-svg-icons";

const ApplicantDetailsModal = ({ open, onClose, applicant }) => {
    if (!open || !applicant) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[99999] p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl animate-fadeIn relative">

                {/* HEADER */}
                <div className="flex justify-between items-center py-4 border-b">
                    <div className="bg-blue-600 rounded-r-full pl-4 pr-6 py-2 shadow-md">
                        <h3 className="text-lg font-normal text-white">
                            Applicant Details - #{applicant.uarn}
                        </h3>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 px-5 text-lg"
                    >
                        <FontAwesomeIcon icon={faTimes} size="lg" />
                    </button>
                </div>

                {/* BODY */}
                <div className="px-6 py-4 space-y-6">

                    {/* TOP ROW */}
                    <div className="grid grid-cols-2 gap-4">

                        {/* Applicant Name */}
                        <div>
                            <p className="font-normal text-gray-700 pb-2">Applicant Name</p>
                            <p className="text-gray-900">{applicant.full_name || "-"}</p>
                        </div>

                        {/* Status */}
                        <div>
                            <p className="font-normal text-gray-700 pb-2">Status</p>
                            <p className="text-gray-900 capitalize">
                                {applicant.status
                                    ? applicant.status.replace(/_/g, " ")
                                    : "Not Available"}
                            </p>
                        </div>
                    </div>

                    {/* SECOND ROW */}
                    <div className="grid grid-cols-2 gap-4">

                        {/* Report Status */}
                        <div>
                            <p className="font-normal text-gray-700 pb-2">Report Status</p>
                            <p className="text-gray-900 capitalize">
                                {applicant.report_status
                                    ? applicant.report_status.replace(/_/g, " ")
                                    : "Not Available"}
                            </p>
                        </div>

                        {/* Report Remarks */}
                        <div>
                            <p className="font-normal text-gray-700 pb-2">Report Remarks</p>
                            <p className="text-gray-900 capitalize">
                                {applicant.report_remarks || "Not Available"}
                            </p>
                        </div>
                    </div>

                    {/* ------------------------------------------------------------------ */}
                    {/*       🔥 SHOW FILE SECTIONS ONLY IF STATUS IS NOT “CANCELLED”      */}
                    {/* ------------------------------------------------------------------ */}
                    {applicant.status?.toLowerCase() !== "cancelled" && (
                        <div className="grid grid-cols-2 gap-4 mt-4">

                            {/* Report File */}
                            <div className="flex mt-5 items-center">
                                <p className="font-normal text-gray-700">Report File :</p>
                                {applicant.report_url ? (
                                    <a
                                        href={applicant.report_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 ml-3 py-1.5 bg-blue-400 text-white rounded hover:bg-blue-700 text-sm"
                                    >
                                        <FontAwesomeIcon icon={faEye} />
                                        View Report
                                    </a>
                                ) : (
                                    <p className="ml-3 text-gray-500 text-sm">Not Available</p>
                                )}
                            </div>

                            {/* Bill File */}
                            <div className="flex mt-5 items-center">
                                <p className="font-normal text-gray-700">Bill File :</p>
                                {applicant.bill_url ? (
                                    <a
                                        href={applicant.bill_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 ml-3 py-1.5 bg-blue-400 text-white rounded hover:bg-blue-700 text-sm"
                                    >
                                        <FontAwesomeIcon icon={faEye} />
                                        View Bill
                                    </a>
                                ) : (
                                    <p className="ml-3 text-gray-500 text-sm">Not Available</p>
                                )}
                            </div>

                        </div>
                    )}
                    {/* END CONDITIONAL BLOCK */}

                </div>
            </div>
        </div>
    );
};

export default ApplicantDetailsModal;
