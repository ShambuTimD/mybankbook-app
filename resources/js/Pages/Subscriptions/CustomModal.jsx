import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import Select from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import {
    faEye,
    faFileInvoiceDollar,
    faFileAlt,
    faTimes,
    faInfoCircle,
    faPenToSquare,
    faPlus,
    faMinus,
    faUpload,
} from "@fortawesome/free-solid-svg-icons";



const decodeHtml = (html = "") => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
};


/**
 * FileInput Component
 * Updated with "Choose File" style and cancel functionality
 */

const compactEditorConfig = {
    toolbar: [
        "bold",
        "italic",
        "underline",
        "|",
        "bulletedList",
        "numberedList",
        "|",
        "undo",
        "redo",
    ],
    placeholder: "Add notes...",
};
const FileInput = ({
    name,
    label,
    formData,
    setFormData,
    isTableMode = false,
}) => {
    const existingFileUrl =
        name === "bill_media"
            ? formData.bill_url
            : name === "report_media"
                ? formData.report_url
                : null;

    const existingFileName = existingFileUrl
        ? decodeURIComponent(existingFileUrl.split("/").pop())
        : null;

    const onDrop = (acceptedFiles) => {
        if (!acceptedFiles.length) return;
        const file = acceptedFiles[0];
        if (file.type !== "application/pdf") {
            toast.error("Only PDF files are allowed!");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File exceeds 10 MB limit!");
            return;
        }
        setFormData((prev) => ({
            ...prev,
            [name]: file,
        }));
    };

    const removeFile = (e) => {
        e.stopPropagation(); // Prevents the dropzone from opening the file picker
        setFormData((prev) => ({
            ...prev,
            [name]: null,
        }));
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: { "application/pdf": [".pdf"] },
    });


    return (
        <div className={isTableMode ? "w-full" : "mb-4"}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}

            <div
                {...getRootProps()}
                className={`w-full border rounded-lg transition flex items-center px-3 cursor-pointer ${isTableMode
                    ? "h-[38px] border-gray-300 bg-white"
                    : "p-6 border-2 border-dashed"
                    } ${formData[name]
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 bg-white text-gray-400"
                    } ${isDragActive ? "border-blue-500 bg-blue-50" : ""}`}
            >
                <input {...getInputProps()} />

                {!formData[name] ? (
                    <div className="flex items-center gap-2 truncate">
                        <FontAwesomeIcon icon={faUpload} className="text-xs" />
                        <span className="text-xs">Choose PDF file</span>
                    </div>
                ) : (
                    <div className="flex items-center justify-between w-full overflow-hidden">
                        <span className="text-xs font-bold truncate mr-2">
                            {formData[name].name}
                        </span>
                        <button
                            type="button"
                            onClick={removeFile}
                            className="text-red-500 hover:text-red-700 p-1 transition"
                            title="Cancel Upload"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                )}
            </div>

            {existingFileUrl && !formData[name] && !isTableMode && (
                <div className="mt-3 bg-gray-50 border border-gray-300 rounded-lg p-3 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 font-medium">
                                Existing File
                            </span>
                            <a
                                href={existingFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm font-semibold truncate max-w-[200px]"
                            >
                                {existingFileName}
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
const ShareEmailModal = ({ show, onClose, onSend, initialEmail }) => {
    const [email, setEmail] = useState(initialEmail || "");
    const [description, setDescription] = useState("");
    const [dontCcOffice, setDontCcOffice] = useState(false);

    useEffect(() => {
        if (show) {
            setEmail(initialEmail || "");
            setDescription("");
            setDontCcOffice(false);
        }
    }, [show, initialEmail]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col transform transition-all scale-100">
                <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800">Share Report</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To (Email)</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="recipient@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <CKEditor
                            editor={ClassicEditor}
                            config={{ ...compactEditorConfig, autofocus: true }}
                            data={description}
                            onChange={(event, editor) => {
                                const data = editor.getData();
                                setDescription(data);
                            }}
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="Add a message..."
                        />
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <input
                            type="checkbox"
                            id="dont_cc_office_share"
                            checked={dontCcOffice}
                            onChange={(e) => setDontCcOffice(e.target.checked)}
                            className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                        />
                        <label htmlFor="dont_cc_office_share" className="text-sm text-gray-700 cursor-pointer select-none">
                            Don't CC the office
                        </label>
                    </div>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSend({ email, description, dontCcOffice })}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
                    >
                        Send Report
                    </button>
                </div>
            </div>
        </div>
    );
};


const CustomModal = ({
    show,
    initialData = {},
    type = "view",
    onClose,
    onSubmit,
}) => {
    const [formData, setFormData] = useState({});
    const [activeTab, setActiveTab] = useState(type);
    const [skipOfficeHr, setSkipOfficeHr] = useState(false);
    const [allDataSubmitted, setAllDataSubmitted] = useState(false); // Flag for the payload
    const [testMasters, setTestMasters] = useState([]);
    const [reportRows, setReportRows] = useState([
        {
            category: null,
            test: null,
            report_file: null,        // NEW file (File object)
            existing_file_url: null,  // Existing PDF URL
            existing_media_id: null,  // Media ID (for backend)
            notes: "",
        },
    ]);

    const [doNotShareWithCompany, setDoNotShareWithCompany] = useState(false);
    const [shareBill, setShareBill] = useState(false);
    const [shareReport, setShareReport] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [pendingShareData, setPendingShareData] = useState(null);
    const resetModalState = () => {
        setFormData({});
        setActiveTab(type);
        setSkipOfficeHr(false);
        setAllDataSubmitted(false);
        setDoNotShareWithCompany(false);
        setShareBill(false);
        setShareReport(false);
        setShowShareModal(false);
        setPendingShareData(null); setReportRows([
            {
                category: null,
                test: null,
                report_file: null,
                notes: "",
            },
        ]);
    };


    const hasExistingReports =
        Array.isArray(initialData?.report_items) &&
        initialData.report_items.length > 0;



    useEffect(() => {
        if (!show || !initialData || !testMasters.length) return;

        let reportItems = [];

        // ✅ SAFELY NORMALIZE DATA
        if (Array.isArray(initialData.report_items)) {
            reportItems = initialData.report_items;
        } else if (typeof initialData.report_items === "string") {
            try {
                reportItems = JSON.parse(initialData.report_items);
            } catch (e) {
                console.error("Invalid report_items JSON", e);
                reportItems = [];
            }
        }

        if (!reportItems.length) {
            setReportRows([
                {
                    category: null,
                    test: null,
                    report_file: null,
                    existing_file_url: null,
                    existing_media_id: null,
                    notes: "",
                },
            ]);
            return;
        }

        const rows = reportItems.map((item) => {
            const category = testMasters.find(
                (c) => Number(c.id) === Number(item.category_id)
            );

            const test = category?.tests?.find(
                (t) => Number(t.id) === Number(item.test_id)
            );

            return {
                category: category
                    ? { value: category.id, label: category.name }
                    : null,

                test: test
                    ? {
                        value: test.id,
                        label: test.test_name,
                        code: test.test_code,
                    }
                    : null,

                report_file: null, // no re-upload
                existing_file_url: item.file_path
                    ? `/${item.file_path}`
                    : null,

                existing_media_id: item.media_id || item.id,
                notes: decodeHtml(item.notes || ""), // ✅ FIXED
                is_readonly: true, // ✅ FLAG
            };
        });

        setReportRows(rows);
    }, [show, initialData, testMasters]);

    useEffect(() => {
        if (!show) return;

        if (initialData?.report_status === "report_uploaded") {
            setAllDataSubmitted(true);
        } else {
            setAllDataSubmitted(false);
        }
    }, [show, initialData?.report_status]);



    useEffect(() => {
        if (show) {
            axios.get("/api/test-masters").then((res) => {
                setTestMasters(res.data.data || []);
            });
        }
    }, [show]);

    const selectStyles = {
        control: (base) => ({
            ...base,
            height: "38px",
            minHeight: "38px",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            borderColor: "#D1D5DB",
            boxShadow: "none",
            "&:hover": { borderColor: "#3B82F6" },
        }),
        valueContainer: (base) => ({ ...base, padding: "0 8px" }),
        input: (base) => ({ ...base, margin: 0, padding: 0 }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        menu: (base) => ({ ...base, zIndex: 9999 }),
    };

    const addReportRow = () => {
        setReportRows([
            ...reportRows,
            { category: null, test: null, report_file: null, notes: "" },
        ]);
    };

    const removeReportRow = (index) => {
        if (reportRows.length === 1) return;
        setReportRows(reportRows.filter((_, i) => i !== index));
    };

    const updateReportRow = (index, key, value) => {
        const updated = [...reportRows];
        updated[index][key] = value;
        setReportRows(updated);
    };

    useEffect(() => {
        if (show) {
            setFormData({
                ...initialData,
                status: initialData.status?.toLowerCase() || "",
            });
            setActiveTab(type);
            document.body.style.overflow = "hidden";
        } else {
            resetModalState();
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [show, initialData, type]);

    if (!show) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e, actionType = "save") => {
        e?.preventDefault();

        // If sharing, open the share modal first
        if (actionType === "share" && activeTab === "report") {
            // Validation for mandatory fields before opening modal
            const isValid = reportRows.every(
                (row) => row.category && row.test && (row.report_file || row.existing_media_id)
            );

            if (!isValid) {
                toast.error("Please ensure all Category, Test, and Report File fields are filled before sharing.");
                return;
            }
            setShowShareModal(true);
            return;
        }

        submitData(actionType);
    };

    const handleShareConfirm = (shareData) => {
        submitData("share", shareData);
        setShowShareModal(false);
    };

    const submitData = (actionType, extraShareData = null) => {
        let submissionData = { ...formData };

        if (activeTab === "report") {
            const isValid = reportRows.every(
                (row) => row.category && row.test && (row.report_file || row.existing_media_id)
            );

            if (!isValid) {
                toast.error("Please ensure all Category, Test, and Report File fields are filled.");
                return;
            }

            onSubmit?.({
                type: "report",
                formData: {
                    id: formData.id,

                    // ✅ RAW rows (files still intact)
                    reportRows,

                    // ✅ FLAGS
                    is_final_submission: allDataSubmitted,
                    do_not_share_with_company: doNotShareWithCompany,
                    share_report: actionType === "share",

                    // ✅ SHARE DATA (only when sharing)
                    share_email:
                        actionType === "share" && extraShareData
                            ? extraShareData.email
                            : null,

                    share_description:
                        actionType === "share" && extraShareData
                            ? extraShareData.description
                            : null,

                    dont_cc_office:
                        actionType === "share" && extraShareData
                            ? extraShareData.dontCcOffice
                            : 0,
                },
            });

            onClose();
            return;
        }


        if (activeTab === "bill") {
            submissionData.skip_office_hr = skipOfficeHr;
            submissionData.share_bill = actionType === "share";
        }

        console.log("Submitting Payload:", submissionData);
        // return;

        onSubmit?.({ type: activeTab, formData: submissionData });
        onClose();
    };

    const isAttended = (initialData.status || "").toLowerCase() === "attended";
    const isReportFinalized = initialData?.report_status === "report_uploaded";

    const isNotStarted =
        (initialData.status || "").toLowerCase() === "not_started";

    const categoryOptions = testMasters.map((c) => ({
        value: c.id,
        label: c.name,
    }));

    const getTestOptions = (categoryId) => {
        const cat = testMasters.find((c) => c.id === categoryId);
        if (!cat) return [];
        return cat.tests.map((t) => ({
            value: t.id,
            label: t.test_name,
            code: t.test_code,
        }));
    };

    const ApplicantInfo = () => (
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-700">
                <p><strong>Name:</strong> {formData.full_name}</p>
                <p><strong>Type:</strong> {formData.applicant_type}</p>
                <p><strong>Gender:</strong> {formData.gender}</p>
                <p><strong>Age:</strong> {formData.age}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Phone:</strong> {formData.phone}</p>
                <p><strong>Designation:</strong> {formData.designation}</p>
                <p><strong>Relation:</strong> {formData.emp_relation || "-"}</p>
                <p className="sm:col-span-2">
                    <strong>Medical Conditions:</strong>{" "}
                    {Array.isArray(formData.medical_conditions)
                        ? formData.medical_conditions.join(", ")
                        : formData.medical_conditions || "N/A"}
                </p>
                <p className="sm:col-span-2">
                    <strong>Remarks:</strong> {formData.remarks || "-"}
                </p>
            </div>
        </div>
    );

    const tabList = [
        { key: "view", label: "View Details", icon: faEye },
        { key: "status_only", label: "Update Status", icon: faPenToSquare },
        {
            key: "bill",
            label: "Upload Bill",
            icon: faFileInvoiceDollar,
            disabled: !isAttended,
        },
        {
            key: "report",
            label: "Upload Report",
            icon: faFileAlt,
            disabled: !isAttended,
        },
    ];

    let headerTitle = "Applicant Details";
    if (activeTab === "status_only") headerTitle = "Update Status";
    if (activeTab === "bill") headerTitle = "Upload Bill";
    if (activeTab === "report") headerTitle = "Upload Applicant Report";

    const InfoTooltip = ({ text }) => {
        return (
            <div className="relative group inline-flex">
                <FontAwesomeIcon
                    icon={faInfoCircle}
                    className="text-blue-400 cursor-help text-xs"
                />
                <div
                    className="
                    fixed
                    hidden
                    group-hover:block
                    mt-2
                    w-64
                    p-3
                    bg-gray-800
                    text-white
                    text-[11px]
                    rounded-lg
                    shadow-xl
                    z-[99999]
                "
                    style={{ transform: "translateY(8px)" }}
                >
                    {text}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
                className="bg-white rounded-xl shadow-lg w-full max-w-5xl h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-blue-700">
                        {headerTitle} —{" "}
                        {formData?.uarn
                            ? `#${formData.uarn.toUpperCase()}`
                            : ""}
                    </h2>
                    <button
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => {
                            resetModalState();
                            onClose();
                        }}
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex justify-center bg-gray-100 border-b border-gray-200">
                    {tabList.map((tab) => (
                        <button
                            key={tab.key}
                            disabled={tab.disabled}
                            onClick={() =>
                                !tab.disabled && setActiveTab(tab.key)
                            }
                            className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium transition-all ${activeTab === tab.key
                                ? "bg-blue-600 text-white rounded-t-lg shadow-sm"
                                : tab.disabled
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-gray-600 hover:text-blue-600"
                                }`}
                        >
                            <FontAwesomeIcon icon={tab.icon} />
                            <span className="hidden sm:inline">
                                {tab.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <form
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto p-5 space-y-6"
                >
                    {activeTab === "view" && <ApplicantInfo />}

                    {activeTab === "status_only" && (
                        <div className="space-y-5">
                            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status || ""}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                                        required
                                        disabled={isAttended || isNotStarted}
                                    >
                                        <option value="">Select status</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="attended">Attended</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="no_show">No Show</option>
                                    </select>
                                    {isNotStarted && (
                                        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                            <FontAwesomeIcon icon={faInfoCircle} />
                                            Status cannot be updated until the applicant process starts.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status Notes / Remarks
                                    </label>
                                    <textarea
                                        name="status_remarks"
                                        value={formData.status_remarks || ""}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 h-32 resize-none text-sm"
                                        placeholder="Add remarks..."
                                        disabled={isAttended || isNotStarted}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "bill" && (
                        <div className="space-y-5">
                            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Bill Notes
                                    </label>
                                    <textarea
                                        name="bill_media_notes"
                                        value={formData.bill_media_notes || ""}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 h-24 resize-none text-sm"
                                        placeholder="Add notes for this bill"
                                    />
                                </div>
                                <FileInput
                                    name="bill_media"
                                    label="Upload Bill (PDF up to 10MB)"
                                    formData={formData}
                                    setFormData={setFormData}
                                />
                                <div className="flex items-center gap-2 mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <input
                                        type="checkbox"
                                        checked={skipOfficeHr}
                                        onChange={(e) => setSkipOfficeHr(e.target.checked)}
                                        className="h-4 w-4 text-blue-600 rounded"
                                    />
                                    <label className="text-sm text-gray-700">
                                        Skip sending email to Office & HR
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "report" && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-tight">Upload Reports</h3>
                                <div className="group relative flex items-center">
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-300 shadow-sm overflow-visible">
                                <table className="w-full table-fixed divide-y divide-gray-200 border-collapse">
                                    <thead className="bg-gray-50">
                                        <tr className="text-center">
                                            <th className="w-[20%] px-3 py-3 text-[11px] font-bold text-gray-600 border uppercase">
                                                Category <span className="text-red-500">*</span>
                                                <InfoTooltip text="Select the medical test category." />
                                            </th>

                                            <th className="w-[20%] px-3 py-3 text-[11px] font-bold text-gray-600 border uppercase">
                                                Report Type <span className="text-red-500">*</span>
                                                <InfoTooltip text="Choose the specific test." />
                                            </th>

                                            <th className="w-[18%] px-3 py-3 text-[11px] font-bold text-gray-600 border uppercase">
                                                Report File (PDF) <span className="text-red-500">*</span>
                                                <InfoTooltip text="Upload PDF (max 10MB)." />
                                            </th>

                                            <th className="w-[32%] px-3 py-3 text-[11px] font-bold text-gray-600 border uppercase">
                                                Notes
                                                <InfoTooltip text="Optional notes." />
                                            </th>

                                            <th className="w-[10%] px-3 py-3 text-[11px] font-bold text-gray-600 border uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {reportRows.map((row, index) => (
                                            <tr key={index}>
                                                <td className="border p-2 w-[22%]">
                                                    <Select
                                                        options={categoryOptions}
                                                        value={row.category}
                                                        onChange={(val) => {
                                                            updateReportRow(index, "category", val);
                                                            updateReportRow(index, "test", null);
                                                        }}
                                                        styles={selectStyles}
                                                        placeholder="Select Category"
                                                        menuPortalTarget={document.body}
                                                        isDisabled={hasExistingReports}
                                                    />
                                                </td>
                                                <td className="border p-2 w-[22%]">
                                                    <Select
                                                        options={row.category ? getTestOptions(row.category.value) : []}
                                                        value={row.test}
                                                        onChange={(val) => updateReportRow(index, "test", val)}
                                                        styles={selectStyles}
                                                        placeholder="Select Test"
                                                        // isDisabled={!row.category}
                                                        menuPortalTarget={document.body}
                                                        isDisabled={hasExistingReports || !row.category}
                                                    />
                                                </td>
                                                <td className="border p-2 w-[25%] text-center">

                                                    {!hasExistingReports && (
                                                        <input
                                                            type="file"
                                                            accept="application/pdf"
                                                            className="block w-full text-xs text-gray-600
                                                            file:mr-2 file:py-1.5 file:px-3
                                                            file:rounded file:border-0
                                                            file:text-xs file:bg-blue-50
                                                            file:text-blue-700 hover:file:bg-blue-100"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;

                                                                if (file.type !== "application/pdf") {
                                                                    toast.error("Only PDF files are allowed");
                                                                    return;
                                                                }

                                                                if (file.size > 10 * 1024 * 1024) {
                                                                    toast.error("File exceeds 10MB limit");
                                                                    return;
                                                                }

                                                                updateReportRow(index, "report_file", file);
                                                            }}
                                                        />
                                                    )}

                                                    {hasExistingReports && row.existing_file_url && (
                                                        <a
                                                            href={row.existing_file_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 mt-2
                                                            text-[11px] px-2 py-1
                                                            bg-blue-50 text-blue-700
                                                            rounded border border-blue-200
                                                            hover:bg-blue-100"
                                                        >
                                                            <FontAwesomeIcon icon={faEye} />
                                                            View
                                                        </a>
                                                    )}
                                                </td>

                                                <td className="px-2 py-3 border border-gray-300 align-top w-[30%]">

                                                    <div className="border border-gray-300 rounded-lg bg-white">
                                                        <CKEditor
                                                            editor={ClassicEditor}
                                                            data={row.notes || ""}
                                                            config={{
                                                                ...compactEditorConfig,
                                                                toolbar: hasExistingReports ? [] : compactEditorConfig.toolbar,
                                                                readOnly: hasExistingReports,
                                                            }}
                                                            onChange={(event, editor) => {
                                                                if (!hasExistingReports) {
                                                                    updateReportRow(index, "notes", editor.getData());
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </td>

                                                <td className="px-2 py-3 border border-gray-300 align-middle text-center">
                                                    {!hasExistingReports && (
                                                        <div className="flex justify-center gap-2">
                                                            {reportRows.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeReportRow(index)}
                                                                    className="text-red-500 hover:text-red-700 transition"
                                                                >
                                                                    <FontAwesomeIcon
                                                                        icon={faMinus}
                                                                        className="bg-red-50 p-2 rounded border border-red-200"
                                                                    />
                                                                </button>
                                                            )}

                                                            {index === reportRows.length - 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={addReportRow}
                                                                    className="text-green-600 hover:text-green-800 transition"
                                                                >
                                                                    <FontAwesomeIcon
                                                                        icon={faPlus}
                                                                        className="bg-green-50 p-2 rounded border border-green-200"
                                                                    />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {hasExistingReports && (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Final Submission Flag */}
                            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mt-4">
                                <input
                                    type="checkbox"
                                    id="final_check"
                                    checked={allDataSubmitted}
                                    disabled={initialData?.report_status === "report_uploaded"}
                                    onChange={(e) => setAllDataSubmitted(e.target.checked)}
                                    className="h-5 w-5 text-blue-600 rounded cursor-pointer transition focus:ring-blue-500"
                                />
                                <label htmlFor="final_check" className="text-sm font-semibold text-blue-800 cursor-pointer select-none">
                                    All reports for this applicant have been uploaded. Mark as complete.
                                </label>
                            </div>
                            {/* Do Not Share Flag */}
                            <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl mt-3">
                                <input
                                    type="checkbox"
                                    id="do_not_share_company"
                                    checked={doNotShareWithCompany}
                                    onChange={(e) => setDoNotShareWithCompany(e.target.checked)}
                                    className="h-5 w-5 text-orange-600 rounded cursor-pointer focus:ring-orange-500"
                                />
                                <label
                                    htmlFor="do_not_share_company"
                                    className="text-sm font-semibold text-orange-700 cursor-pointer select-none"
                                >
                                    Do not share this report with company officer
                                </label>
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                    <button
                        type="button"
                        className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
                        onClick={() => {
                            resetModalState();
                            onClose();
                        }}
                    >
                        Close
                    </button>

                    {activeTab === "status_only" && (
                        <button
                            disabled={isAttended || isNotStarted}
                            type="button"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                            onClick={() => {
                                if (isAttended || isNotStarted) return;
                                if (!window.confirm("Are you sure you want to update the status?")) return;
                                handleSubmit();
                            }}
                        >
                            Update Status
                        </button>
                    )}

                    {activeTab === "bill" && (
                        <>
                            <button
                                type="button"
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                                onClick={handleSubmit}
                            >
                                Upload Bill & Save
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                                onClick={() => handleSubmit(null, "share")}
                            >
                                Share Bill
                            </button>
                        </>
                    )}

                    {activeTab === "report" && (
                        <>
                            <button
                                type="button"
                                disabled={isReportFinalized}
                                onClick={handleSubmit}
                                className={`px-4 py-2 rounded-lg transition text-sm font-medium
                                    ${isReportFinalized
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-blue-600 text-white hover:bg-blue-700"
                                    }`}
                            >
                                Save All Reports
                            </button>

                            <button
                                type="button"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                                onClick={() => handleSubmit(null, "share")}
                            >
                                Share Report
                            </button>
                        </>
                    )}
                </div>
            </div>
            <ShareEmailModal
                show={showShareModal}
                onClose={() => setShowShareModal(false)}
                onSend={handleShareConfirm}
                initialEmail={formData.email}
            />
        </div>
    );
};

export default CustomModal;
