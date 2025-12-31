// resources/js/Pages/Admin/Reports/Components/UploadReportModal.jsx
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import toast from "react-hot-toast";

const UploadReportModal = ({ open, row, onClose, onUploadSuccess }) => {
    const [reportFile, setReportFile] = useState(null);
    const [reportNotes, setReportNotes] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    if (!open || !row) return null;

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        validateAndSetFile(file);
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        validateAndSetFile(file);
    };

    const validateAndSetFile = (file) => {
        if (!file) return;
        if (file.type !== "application/pdf") {
            toast.error("Only PDF files are allowed!");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File exceeds 10 MB limit!");
            return;
        }
        setReportFile(file);
        toast.success("File ready for upload.");
    };

    const handleUpload = async () => {
        if (!reportFile) return toast.error("Please select a report file.");

        const formData = new FormData();
        formData.append("report_media", reportFile);
        formData.append("report_notes", reportNotes);

        try {
            setUploading(true);
            setUploadProgress(0);

            const response = await axios.post(
                route("booking.uploadReport", { id: row.id }),
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                    onUploadProgress: (e) => {
                        const percent = Math.round((e.loaded * 100) / e.total);
                        setUploadProgress(percent);
                    },
                }
            );

            toast.success(response.data?.message || "Report uploaded successfully!");
            setUploadProgress(100);
            onUploadSuccess?.();
            setTimeout(() => {
                onClose();
            }, 600);
        } catch (err) {
            toast.error(err.response?.data?.message || "Upload failed!");
        } finally {
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
            }, 800);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3 border-b bg-blue-50 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-blue-800">
                        Upload Report for (#{row.brn})
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                {/* Drop Zone */}
                <div
                    className={`p-5 border-2 border-dashed rounded-lg text-center cursor-pointer transition ${uploading
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-300 hover:border-blue-400"
                        }`}
                    onDrop={handleFileDrop}
                    onDragOver={(e) => e.preventDefault()}
                >
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id={`reportFileInput-${row.id}`}
                    />
                    <label
                        htmlFor={`reportFileInput-${row.id}`}
                        className="cursor-pointer block"
                    >
                        {uploading ? (
                            <>
                                <p className="text-sm text-gray-700 mb-2">
                                    Uploading: {reportFile?.name || "File"}...
                                </p>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {uploadProgress}% completed
                                </p>
                            </>
                        ) : reportFile ? (
                            <p className="text-sm text-gray-700">
                                Selected: <strong>{reportFile.name}</strong>
                            </p>
                        ) : (
                            <p className="text-sm text-gray-500">
                                Drag & drop or click to select a PDF report file
                            </p>
                        )}
                    </label>
                    <p className="text-xs text-gray-400 mt-2">
                        Only PDF files up to 10 MB are allowed.
                    </p>
                </div>

                {/* Notes */}
                <div className="p-5 space-y-3">
                    <textarea
                        rows={3}
                        placeholder="Add notes (optional)"
                        value={reportNotes}
                        onChange={(e) => setReportNotes(e.target.value)}
                        className="w-full text-sm border rounded-md px-3 py-2"
                    />
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t bg-gray-50 text-right">
                    <button
                        disabled={uploading}
                        onClick={handleUpload}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
                    >
                        {uploading ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                                Uploading...
                            </>
                        ) : (
                            "Upload"
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="ml-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadReportModal;
