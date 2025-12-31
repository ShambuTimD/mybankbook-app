import React, { useState } from "react";
import { useForm, router, Head } from "@inertiajs/react";
import toast from "react-hot-toast";
import SettingsSidebar from "./SettingsSidebar";

const AppSettings = ({ settings }) => {
    const [previewShortLogo, setPreviewShortLogo] = useState(
        settings.application_short_logo
    );
    const [previewBigLogo, setPreviewBigLogo] = useState(
        settings.application_big_logo
    );
    const [previewFavicon, setPreviewFavicon] = useState(
        settings.application_favicon
    );
    const [previewQR, setPreviewQR] = useState(settings.business_pmt_qr);

    const { data, setData, post, processing, errors } = useForm({
        application_name: settings.application_name || "",
        application_short_title: settings.application_short_title || "",
        application_version: settings.application_version || "",
        company_name: settings.company_name || "",
        company_short_name: settings.company_short_name || "",
        application_short_logo: null,
        application_big_logo: null,
        application_favicon: null,
        business_pmt_link: settings.business_pmt_link || "",
        business_pmt_qr: null,
        booking_open_offset_days: settings.booking_open_offset_days || 1,
    });

    const handleFileChange = (e, field, setPreview) => {
        const file = e.target.files[0];
        if (file) {
            setData(field, file);
            setPreview(URL.createObjectURL(file));
        }
    };

    console.log("settings:", settings);

    const handleSubmit = (e) => {
        e.preventDefault();

        // 🚀 Log form data before sending
        // console.log("Submitting Settings Data:", data);
        // return;

        post(route("settings.update"), {
            forceFormData: true, // important when uploading files
            onSuccess: (page) => {
                console.log("✅ Response on Success:", page);
                toast.success("Settings updated successfully!");
            },
            onError: (errors) => {
                console.error("❌ Validation Errors:", errors);
                toast.error("Error updating settings.");
            },
            onFinish: () => {
                console.log("📌 Request finished");
            },
        });
    };

    return (
        <>
            <Head title={"General App Settings"} />
            <div className="flex flex-col md:flex-row gap-6 p-6">
                {/* Sidebar */}
                <SettingsSidebar />

                {/* Main Form */}
                <div className="flex-1 bg-white border rounded-lg shadow-sm p-8">
                    <h2 className="text-2xl font-semibold text-blue-700 mb-6">
                        General App Settings
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">
                                Application Name
                            </label>
                            <input
                                type="text"
                                value={data.application_name}
                                onChange={(e) =>
                                    setData("application_name", e.target.value)
                                }
                                className="w-full border px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-2">
                                Short Title
                            </label>
                            <input
                                type="text"
                                value={data.application_short_title}
                                onChange={(e) =>
                                    setData(
                                        "application_short_title",
                                        e.target.value
                                    )
                                }
                                className="w-full border px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 font-medium mb-2">
                                Company Name
                            </label>
                            <input
                                type="text"
                                value={data.company_name}
                                onChange={(e) =>
                                    setData("company_name", e.target.value)
                                }
                                className="w-full border px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Short Logo */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">
                                Short Logo
                            </label>
                            {previewShortLogo && (
                                <img
                                    src={previewShortLogo}
                                    alt="Short Logo"
                                    className="w-32 h-auto mb-2 border rounded-md"
                                />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    handleFileChange(
                                        e,
                                        "application_short_logo",
                                        setPreviewShortLogo
                                    )
                                }
                            />
                        </div>

                        {/* Big Logo */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">
                                Big Logo
                            </label>
                            {previewBigLogo && (
                                <img
                                    src={previewBigLogo}
                                    alt="Big Logo"
                                    className="w-32 h-auto mb-2 border rounded-md"
                                />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    handleFileChange(
                                        e,
                                        "application_big_logo",
                                        setPreviewBigLogo
                                    )
                                }
                            />
                        </div>

                        {/* Favicon */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">
                                Favicon Logo
                            </label>
                            {previewFavicon && (
                                <img
                                    src={previewFavicon}
                                    alt="Favicon"
                                    className="w-12 h-12 mb-2 border rounded-md"
                                />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    handleFileChange(
                                        e,
                                        "application_favicon",
                                        setPreviewFavicon
                                    )
                                }
                            />
                            {errors.application_favicon && (
                                <p className="text-red-600 text-sm mt-1">
                                    {errors.application_favicon}
                                </p>
                            )}
                        </div>

                        {/* Payment Link */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">
                                Business Payment Link
                            </label>
                            <input
                                type="text"
                                value={data.business_pmt_link}
                                onChange={(e) =>
                                    setData("business_pmt_link", e.target.value)
                                }
                                className="w-full border px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Payment QR */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">
                                Business Payment QR
                            </label>
                            {previewQR && (
                                <img
                                    src={previewQR}
                                    alt="Payment QR"
                                    className="w-32 h-auto mb-2 border rounded-md"
                                />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    handleFileChange(
                                        e,
                                        "business_pmt_qr",
                                        setPreviewQR
                                    )
                                }
                            />
                        </div>

                        {/* Appointment Allowed After */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">
                                Appointment Allowed After (Days)
                            </label>
                            <input
                                type="number"
                                value={data.booking_open_offset_days}
                                min="0"
                                max="30"
                                onChange={(e) =>
                                    setData(
                                        "booking_open_offset_days",
                                        e.target.value
                                    )
                                }
                                className="w-full border px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Save Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
                            >
                                {processing ? "Saving..." : "Save Settings"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default AppSettings;
