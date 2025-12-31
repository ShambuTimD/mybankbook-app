import React from "react";
import { Head, usePage } from "@inertiajs/react";

export default function MaintenancePage() {
    const { settings } = usePage().props;

    return (
        <>
            {/* <Head title={`${settings.app_settings.application_name} Health Check Booking`} /> */}
            <Head>
                <title>Page Under Maintenance</title>
                <link
                    rel="icon"
                    type="image/png"
                    href={`${settings.app_settings.application_favicon}`}
                />
            </Head>
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="bg-white shadow-lg rounded-lg p-8 text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">
                        🚧 Page Under Maintenance
                    </h1>
                    <p className="text-gray-700">
                        We’re working on improvements. Please check back later.
                    </p>
                </div>
            </div>
        </>
    );
}
