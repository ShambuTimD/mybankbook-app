import React, { useState, useCallback, useRef, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import { useDropzone } from "react-dropzone";
import ComponentCard from "@/Components/common/ComponentCard";
import toast from "react-hot-toast";
import CustomModal from "./CustomModal";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import ApplicantsTable from "./ApplicantsTable";
import Select from "react-select";
import "react-datepicker/dist/react-datepicker.css";

export default function Edit({
    title = "Edit Booking",
    booking,
    statusOptions = [],
}) {
    const isHold = booking?.is_hold == 1;
    const [status, setStatus] = useState(booking?.booking_status || "pending");
    // Only include selected statuses in dropdown
    const allowedStatuses =
        booking?.booking_status === "pending"
            ? [
                "pending",
                "confirmed",
                "cancelled",
                "partially_completed",
                "completed",
            ]
            : ["confirmed", "cancelled", "partially_completed", "completed"];

    // Filter backend-provided status options
    const filteredStatusOptions = statusOptions.filter((opt) =>
        allowedStatuses.includes(opt.value)
    );
    const reactSelectOptions = filteredStatusOptions.map((opt) => ({
        value: opt.value,
        label: opt.label,
    }));

    const [statusRemarks, setStatusRemarks] = useState(
        booking?.status_remarks || ""
    );
    const [billNotes, setBillNotes] = useState(booking?.bill_media_notes || "");

    // ✅ Changed initial state to an object
    const [files, setFiles] = useState({});
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showBillModal, setShowBillModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const dropdownRef = useRef(null);
    const [loadingApplicants, setLoadingApplicants] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [formData, setFormData] = useState({});
    const [billUploading, setBillUploading] = useState(false);
    const [billProgress, setBillProgress] = useState(0);
    const [mainSubmitting, setMainSubmitting] = useState(false);
    const [companyName, setCompanyName] = useState("");
    const [office, setOfficeName] = useState({});
    const applicants = Array.isArray(booking?.details) ? booking.details : [];

    useEffect(() => {
        setCompanyName(booking?.company?.name || "");
        setOfficeName(booking?.office || {});
    }, [booking]);

    const [modalType, setModalType] = useState(null);
    const [modalTitle, setModalTitle] = useState("");
    const [modalData, setModalData] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [fullPageLoading, setFullPageLoading] = useState(false);

    // Open modal dynamically based on action type
    const openModal = (type, booking) => {
        setModalType(type);
        setModalData(booking);
        setShowModal(true);

        switch (type) {
            case "view":
                setModalTitle("View Applicant Details");
                break;

            case "status_only":
                setModalTitle("Update Applicant Status");
                break;

            case "bill":
                setModalTitle("Upload Bill");
                break;

            case "report":
                setModalTitle("Upload Report");
                break;

            default:
                setModalTitle("Action"); // safe fallback
                break;
        }

        console.log("Opening modal for:", type, booking);
    };

    const refreshApplicants = useCallback(() => {
        setLoadingApplicants(true); // show loader
        router.reload({
            only: ["booking"], // or ["applicants"] if that’s how it’s passed
            onFinish: () => setLoadingApplicants(false), // hide loader when done
        });
    }, []);

    // Close modal
    const closeModal = (shouldRefresh = false) => {
        setShowModal(false);
        setModalType(null);
        setModalData({});
        if (shouldRefresh) setRefreshKey((prev) => prev + 1); // 🔁 force refresh
    };

    // Handle modal form submission
    const handleModalSubmit = ({ type, formData }) => {
        console.log("Submitting:", type, formData);
        // return; // REMOVE THIS IN PRODUCTION

        // BILL UPLOAD
        if (type === "bill") {
            if (isHold) {
                toast.error("You cannot upload Bill — Booking is HOLD.");
                return;
            }
            const payload = new FormData();
            payload.append("bill_media_notes", formData.bill_media_notes || "");
            if (formData.bill_media instanceof File) {
                payload.append("bill_media", formData.bill_media);
            }

            setFullPageLoading(true);

            axios
                .post(
                    route("booking.uploadBill", { id: formData.id }),
                    payload,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                        onUploadProgress: (progressEvent) => {
                            const percent = Math.round(
                                (progressEvent.loaded * 100) /
                                progressEvent.total
                            );
                            // We keep this to track modal upload, but it's not tied to the main page state
                            // setUploadProgress(percent); // This line was removed, but you could use a local modal progress state if needed
                        },
                    }
                )
                .then((res) => {
                    toast.success(res.data.message);
                    closeModal(true);
                })
                .catch((err) => {
                    toast.error(
                        err.response?.data?.message || "Bill upload failed!"
                    );
                })
                .finally(() => {
                    setFullPageLoading(false);
                });

            return;
        }

        // ============================
        // REPORT UPLOAD (FIXED)
        // ============================
        if (type === "report") {
            const payload = new FormData();

            formData.reportRows.forEach((row, index) => {
                // HARD VALIDATION
                if (!(row.report_file instanceof File)) {
                    console.error("Missing file at row", index);
                    return;
                }

                payload.append(
                    `report_items[${index}][category_id]`,
                    row.category.value
                );

                payload.append(
                    `report_items[${index}][test_id]`,
                    row.test.value
                );

                payload.append(
                    `report_items[${index}][notes]`,
                    row.notes || ""
                );

                payload.append(
                    `report_items[${index}][report_file]`,
                    row.report_file // 🔥 REAL FILE OBJECT
                );
            });

            payload.append(
                "is_final_submission",
                formData.is_final_submission ? 1 : 0
            );

            payload.append(
                "do_not_share_with_company",
                formData.do_not_share_with_company ? 1 : 0
            );

            payload.append(
                "share_report",
                formData.share_report ? 1 : 0
            );

            if (formData.share_report) {
                payload.append("share_email", formData.share_email || "");
                payload.append("share_description", formData.share_description || "");
                payload.append("dont_cc_office", formData.dont_cc_office ? 1 : 0);
            }

            // 🔍 DEBUG: Log full FormData payload
            console.log("===== REPORT UPLOAD PAYLOAD =====");
            for (let [key, value] of payload.entries()) {
                if (value instanceof File) {
                    console.log(key, {
                        name: value.name,
                        size: value.size,
                        type: value.type,
                    });
                } else {
                    console.log(key, value);
                }
            }
            console.log("=================================");
            // return;

            setFullPageLoading(true);

            axios.post(
                route("booking.uploadReport", { id: formData.id }),
                payload,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            )
                .then(res => {
                    toast.success(res.data.message);
                    closeModal(true);
                })
                .catch(err => {
                    toast.error(err.response?.data?.message || "Upload failed");
                })
                .finally(() => {
                    setFullPageLoading(false);
                });

            return;
        }



        // STATUS UPDATE
        if (type === "status_only") {
            setFullPageLoading(true);

            axios
                .post(
                    route("booking.detailUpdateStatus", { id: formData.id }),
                    {
                        status: formData.status,
                        status_remarks: formData.status_remarks || "",
                        send_mail: "no",
                        skip_office_hr: 1,
                    }
                )
                .then((res) => {
                    toast.success("Status updated successfully!");
                    closeModal(true);
                })
                .catch((err) => {
                    toast.error(
                        err.response?.data?.message || "Status update failed!"
                    );
                })
                .finally(() => {
                    setFullPageLoading(false);
                });

            return;
        }

        /** ============================
         * STATUS UPDATE + BILL UPLOAD + EMAIL
         * ============================ */
        if (type === "status") {
            const payload = new FormData();

            // Required status fields
            payload.append("status", formData.status || "");
            payload.append("status_remarks", formData.status_remarks || "");

            // Bill notes
            payload.append("bill_media_notes", formData.bill_media_notes || "");

            // File upload
            if (formData.bill_media instanceof File) {
                payload.append("bill_media", formData.bill_media);
            }

            // Email control
            payload.append("send_mail", "no"); // yes / no
            payload.append("skip_office_hr", formData.skipOfficeHr ? 1 : 0); // 1/0

            setFullPageLoading(true);
            console.log("Submitting status update with payload:", formData);

            axios
                .post(
                    route("booking.detailStatus", { id: formData.id }),
                    payload,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                        onUploadProgress: (progressEvent) => {
                            const percent = Math.round(
                                (progressEvent.loaded * 100) /
                                progressEvent.total
                            );
                            // setUploadProgress(percent); // This was part of the bug
                            s;
                        },
                    }
                )
                .then((res) => {
                    toast.success(res.data.message);
                    closeModal(true);
                })
                .catch((err) => {
                    toast.error(
                        err.response?.data?.message || "Status update failed!"
                    );
                })
                .finally(() => {
                    setFullPageLoading(false);
                });

            return;
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target)
            ) {
                setSelectedApplicant(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const onDrop = useCallback(
        (acceptedFiles) => setFiles((prev) => [...prev, ...acceptedFiles]),
        []
    );

    // ✅ NEW: This function handles the separate bill upload
    const handleBillUpload = async () => {
        if (isHold) {
            toast.error("You cannot upload Bill — Booking status is HOLD.");
            return;
        }
        if (!files.bill_media) {
            toast.error("Please select a file to upload.");
            return;
        }

        const payload = new FormData();
        payload.append("bill_media", files.bill_media);
        payload.append("bill_media_notes", billNotes || "");

        try {
            setFullPageLoading(true);
            setBillUploading(true);
            setBillProgress(0);

            const res = await axios.post(
                route("booking.uploadBill", { id: booking.id }),
                payload,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                    onUploadProgress: (progressEvent) => {
                        const percent = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setBillProgress(percent);
                    },
                }
            );

            toast.success(res.data.message || "File uploaded successfully!");
            setBillProgress(100);

            setFiles((prev) => ({ ...prev, bill_media: null }));
            setRefreshKey((prev) => prev + 1);
        } catch (err) {
            toast.error(err.response?.data?.message || "File upload failed!");
        } finally {
            setBillUploading(false);
            setBillProgress(0);
            setFullPageLoading(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        multiple: false,
        accept: { "application/pdf": [".pdf"] },
        maxSize: 10 * 1024 * 1024, // ✅ 10 MB = 10 × 1024 × 1024 bytes
        // ✅ MODIFIED: onDrop now only validates and stages the file
        onDrop: async (acceptedFiles) => {
            if (isHold) {
                toast.error("Cannot upload — Booking is on HOLD.");
                return;
            }
            const file = acceptedFiles[0];
            if (!file) return;

            if (file.type !== "application/pdf") {
                toast.error("Only PDF files are allowed!");
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                toast.error("File size exceeds 10 MB limit!");
                return;
            }

            // Stage the file in state
            setFiles((prev) => ({ ...prev, bill_media: file }));
        },
    });

    const submit = async (e) => {
        e.preventDefault();

        // 🔥 Global confirmation before submit
        const userConfirmed = window.confirm(
            "Are you sure you want to update this booking?"
        );

        if (!userConfirmed) return;

        if (isHold) {
            toast.error("You cannot save or upload bill — Booking is HOLD.");
            return;
        }

        // (optional) keep this too:
        if (status === "cancelled") {
            const ok = window.confirm(
                "Are you sure you want to cancel this booking?"
            );
            if (!ok) return;
        }

        try {
            setFullPageLoading(true);
            setMainSubmitting(true);

            const payload = new FormData();
            payload.append("booking_status", status || "");
            payload.append("status_remarks", statusRemarks || "");
            payload.append("bill_media_notes", billNotes || "");

            if (files.bill_media instanceof File) {
                payload.append("bill_media", files.bill_media);
            }

            const updateRoute = route("booking.status", booking.id);

            const res = await axios.post(updateRoute, payload, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success(res.data.message || "Booking updated successfully!");

            // 🔥🔥 REFRESH APPLICANT TABLE IMMEDIATELY
            setRefreshKey((prev) => prev + 1);

            // Refresh full booking page if needed
            router.reload();
        } catch (err) {
            toast.error(err.response?.data?.message || "Update failed!");
        } finally {
            setMainSubmitting(false);
            setFullPageLoading(false);
        }
    };

    const formatDate = (d) =>
        d
            ? new Date(d).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            })
            : "";

    return (
        <>
            <Head title={title} />

            <ComponentCard
                title={`${title} — ${booking?.brn || ""}`}
                url={route("booking.index")}
                urlText="Back to Bookings"
                urlIcon={faArrowLeft}
            >
                <form onSubmit={submit} className="space-y-8">
                    {/* Booking Info */}
                    <section>
                        <h3 className="mb-3 text-base font-semibold text-gray-600">
                            Booking Info
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ReadonlyInput label="BRN" value={booking?.brn} />
                            <ReadonlyInput
                                label="Preferred Date"
                                value={formatDate(
                                    booking?.pref_appointment_date
                                )}
                            />
                            <ReadonlyInput
                                label="Company"
                                value={booking?.company?.name}
                            />
                            <ReadonlyInput
                                label="Office"
                                value={booking?.office?.office_name}
                            />
                            <ReadonlyInput
                                label="Requested By"
                                value={
                                    booking?.created_by
                                        ? `${booking.created_by.name} (${booking.created_by.email})`
                                        : ""
                                }
                            />
                        </div>
                    </section>

                    {/* Editable status */}
                    <section className="mt-6">
                        <h3 className="mb-3 text-base font-semibold text-gray-600">
                            Update Status & Bill Upload
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                            {/* ====== Left Card: Update Status ====== */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm h-full flex flex-col">
                                <h4 className="text-base font-semibold text-gray-600 mb-5">
                                    Update Status
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-grow">
                                    {/* Status Dropdown */}
                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium text-gray-700 mb-2">
                                            Status
                                        </label>
                                        <Select
                                            value={
                                                reactSelectOptions.find(
                                                    (o) => o.value === status
                                                ) || null
                                            }
                                            onChange={(selected) =>
                                                setStatus(selected?.value || "")
                                            }
                                            options={reactSelectOptions}
                                            placeholder="Select status"
                                            classNamePrefix="rselect"
                                            className="text-sm min-w-[160px]"
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    minHeight: "36px",
                                                    borderColor: "#d1d5db",
                                                    boxShadow: "none",
                                                    "&:hover": {
                                                        borderColor: "#0f75d1",
                                                    },
                                                }),
                                                option: (base, state) => ({
                                                    ...base,
                                                    backgroundColor:
                                                        state.isSelected
                                                            ? "#0f75d1"
                                                            : state.isFocused
                                                                ? "#e8f1fc"
                                                                : "white",
                                                    color: state.isSelected
                                                        ? "white"
                                                        : "#1f2937",
                                                    cursor: "pointer",
                                                    fontSize: "14px",
                                                }),
                                            }}
                                        />
                                    </div>
                                </div>
                                {/* Remarks Textarea */}
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium text-gray-700 mb-2">
                                        Status Notes / Remarks
                                    </label>
                                    <textarea
                                        name="status_remarks"
                                        value={statusRemarks}
                                        onChange={(e) =>
                                            setStatusRemarks(e.target.value)
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-[100px] focus:ring-1 focus:ring-blue-500 resize-none"
                                        placeholder="Add remarks..."
                                    />
                                </div>
                                {/* Spacer for height consistency */}
                                <div className="mt-auto h-6"></div>
                            </div>

                            {/* ====== Right Card: Bill Upload ====== */}
                            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm h-full flex flex-col">
                                <h4 className="text-base font-semibold text-gray-600 mb-5">
                                    Bill Upload
                                </h4>

                                <div className="flex flex-col gap-4 flex-grow">
                                    {/* Bill Notes */}
                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium text-gray-700 mb-2">
                                            Bill Notes
                                        </label>
                                        <textarea
                                            name="bill_media_notes"
                                            value={billNotes}
                                            onChange={(e) =>
                                                setBillNotes(e.target.value)
                                            }
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-[100px] focus:ring-1 focus:ring-blue-500 resize-none"
                                            placeholder="Add notes for this bill"
                                        />
                                    </div>

                                    {/* Existing uploaded bill preview */}
                                    {booking?.bill_media_url &&
                                        !files.bill_media && (
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                                                <a
                                                    href={
                                                        booking.bill_media_url
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline text-sm font-medium truncate"
                                                >
                                                    {booking.bill_media_name ||
                                                        "View Uploaded Bill"}
                                                </a>
                                                <span className="text-xs text-gray-500">
                                                    Existing File
                                                </span>
                                            </div>
                                        )}

                                    {/* File Upload */}
                                    <div
                                        {...getRootProps()}
                                        className={`w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition min-h-[120px] flex flex-col items-center justify-center ${isDragActive
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-300 bg-white"
                                            }`}
                                    >
                                        <input {...getInputProps()} />
                                        {billUploading ? (
                                            <>
                                                <p className="text-sm text-gray-700 mb-2">
                                                    {files.bill_media?.name ||
                                                        "Uploading..."}
                                                </p>
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div
                                                        className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${billProgress}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {billProgress}%
                                                </p>
                                            </>
                                        ) : files.bill_media ? (
                                            <p className="text-gray-800 text-sm">
                                                {files.bill_media.name}
                                            </p>
                                        ) : (
                                            <p className="text-gray-500 text-sm">
                                                Drag & drop PDF here, or click
                                                to select
                                            </p>
                                        )}

                                        <p className="text-xs text-gray-400 mt-2">
                                            Only PDF files up to 10 MB are
                                            allowed.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Applicants Table */}
                    <section>
                        <h3 className="mb-3 text-base font-semibold text-gray-600">
                            Applicants
                        </h3>
                        <ApplicantsTable
                            key={refreshKey}
                            bookingId={booking?.brn}
                            onAction={(type, bookingRow) => {
                                if (isHold) {
                                    toast.error(
                                        "This booking is on HOLD — no applicant actions allowed."
                                    );
                                    return;
                                }

                                switch (type) {
                                    case "view":
                                        openModal("view", bookingRow); // Opens 'view' tab
                                        return;
                                    case "update_status":
                                        openModal("status_only", bookingRow); // Opens 'status_only' tab
                                        return;
                                    case "upload_bill":
                                        openModal("bill", bookingRow); // Opens 'bill' tab
                                        return;
                                    case "upload_report":
                                        openModal("report", bookingRow); // Opens 'report' tab
                                        return;

                                    default:
                                        // Fallback → use same type passed from table
                                        openModal(type, bookingRow);
                                        return;
                                }
                            }}
                        />
                    </section>
                    {/* ---------- Action Buttons ---------- */}
                    <div className="flex justify-end gap-3 mt-8 border-t pt-4">
                        <button
                            type="button"
                            onClick={() => router.visit(route("booking.index"))}
                            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                        >
                            Close
                        </button>
                        <button
                            type="submit"
                            disabled={mainSubmitting}
                            className="px-5 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
                        >
                            {mainSubmitting ? "Saving..." : "Save & Update"}
                        </button>
                    </div>
                </form>
            </ComponentCard>
            {/* Reusable Custom Modal */}
            <CustomModal
                show={showModal}
                title={modalTitle}
                type={modalType}
                initialData={modalData}
                onClose={closeModal}
                onSubmit={handleModalSubmit}
            />
            {fullPageLoading && (
                <div className="fullpage-loader-overlay">
                    <div className="loading-spinner"></div>
                </div>
            )}
            <style>
                {`
                  .fullpage-loader-overlay {
                      position: fixed;
                      top: 0;
                      left: 0;
                      width: 100vw;
                      height: 100vh;
                      background-color: rgba(0, 0, 0, 0.55);
                      backdrop-filter: blur(3px);
                      z-index: 9999;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                  }

                  .loading-spinner {
                      border: 6px solid #f3f3f3;
                      border-top: 6px solid #3498db;
                      border-radius: 50%;
                      width: 60px;
                      height: 60px;
                      animation: spin 1s linear infinite;
                  }

                  @keyframes spin {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                  }
              `}
            </style>
        </>
    );
}
const ReadonlyInput = ({ label, value }) => (
    <div className="grid gap-1 mb-5">
        <label className="text-xs font-medium text-gray-600 mb-2">
            {label}
        </label>
        <input
            type="text"
            value={value ?? ""}
            readOnly
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
        />
    </div>
);
