import ApplicationLogo from "@/AuthComponents/ApplicationLogo";
import { Link } from "@inertiajs/react";
import GridShape from "@/Components/common/GridShape";
import ThemeTogglerTwo from "@/Components/common/ThemeTogglerTwo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCircle } from "@fortawesome/free-solid-svg-icons";
import { usePage } from "@inertiajs/react";
import { useEffect } from "react"; // ✅ import useEffect

export default function GuestLayout({ children }) {
    const { settings } = usePage().props;

    // --- Load Google reCAPTCHA v3 ---
    useEffect(() => {
        // Check if grecaptcha is already loaded
        if (!window.grecaptcha) {
            // Load the script
            const script = document.createElement("script");
            script.src = `https://www.google.com/recaptcha/api.js?render=${import.meta.env.VITE_RECAPTCHA_SITE_KEY
                }`;
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);

            script.onload = () => {
                console.log("reCAPTCHA script loaded", script);

                // Execute reCAPTCHA after script loads
                window.grecaptcha.ready(() => {
                    window.grecaptcha
                        .execute(import.meta.env.VITE_RECAPTCHA_SITE_KEY, {
                            action: "login",
                        })
                        .then((token) => {
                            setEmailFormData("recaptcha_token", token); // attach token to form
                        });
                });
            };
        } else {
            // If grecaptcha is already loaded, just execute
            window.grecaptcha.ready(() => {
                window.grecaptcha
                    .execute(import.meta.env.VITE_RECAPTCHA_SITE_KEY, {
                        action: "login",
                    })
                    .then((token) => {
                        setEmailFormData("recaptcha_token", token); // attach token to form
                    });
            });
        }
    }, []);

    return (
        <>
            <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
                <div className="grid grid-cols-1 sm:grid-cols-[45%_55%] min-h-screen">
                    <div className="flex min-h-screen flex-col items-center bg-white dark:bg-gray-800 pt-6 sm:justify-center sm:pt-0">
                        <div className="text-center left_login my-8">
                            <Link to="/" className="flex justify-center mb-4">
                                <img
                                    width={170}
                                    height={70}
                                    src={
                                        settings.app_settings
                                            .application_short_logo
                                    }
                                    alt="Logo"
                                />
                            </Link>
                            <div className="flex items-center justify-center gap-2 text-indigo-600 text-4xl">
                                <h1 className="text-4xl font-bold text-gray-700 dark:text-gray-300">
                                    Welcome Back!
                                </h1>
                            </div>
                            <p className="mt-2 text-lg text-gray-600 dark:text-gray-500">
                                Your Dashboard Awaits — Let’s Build, Manage, and
                                Grow.
                            </p>
                        </div>

                        <div className="mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg dark:bg-gray-700">
                            {children}
                        </div>

                        <div className="form-cta flex flex-col items-center justify-center">
                            <div className="flex justify-center text-sm text-gray-500 py-3 pb-2 whitespace-nowrap gap-3">
                                <Link to="#" className="hover:underline">
                                    Privacy Policy
                                </Link>
                                <span>|</span>

                                <Link to="#" className="hover:underline">
                                    Disclaimer
                                </Link>
                                <span>|</span>

                                <Link to="#" className="hover:underline">
                                    Terms & Condition
                                </Link>
                                <span>|</span>

                                <Link to="#" className="hover:underline">
                                    Support
                                </Link>
                                <span>|</span>

                                <Link to="#" className="hover:underline">
                                    About Us
                                </Link>
                            </div>

                            <p className="text-sm text-gray-500">
                                © {new Date().getFullYear()} All Rights Reserved by {settings.app_settings?.company_short_name || ""}
                            </p>
                        </div>
                    </div>

                    <div className="items-center hidden w-full h-full bg-brand-950 dark:bg-white/5 lg:grid login_right">
                        <div className="relative flex items-center justify-center z-1">
                            <GridShape />
                            <div className="flex flex-col items-center max-w-xxl">
                                <div className="login_content">
                                    <h2>
                                        <span>
                                            {
                                                settings.app_settings
                                                    .application_name
                                            }
                                        </span>
                                    </h2>
                                    <p className="text-center text-gray-400 dark:text-white/60">
                                        Engineered for performance. Designed for
                                        control. A secure and scalable admin
                                        panel built exclusively for your
                                        business.
                                    </p>
                                </div>
                                <div className="fixed flex flex-col items-center justify-center bottom-0 py-3 pb-5">
                                    <a
                                        href="https://www.timdtech.com/?utm_source=client-software&utm_medium=referral&utm_campaign=tracking_campaign"
                                        target="_blank"
                                        className="flex justify-center mb-2"
                                    >
                                        <img
                                            width={30}
                                            height={48}
                                            src="https://www.timdtech.com/wp-content/uploads/2025/08/favicon.png"
                                            alt="Logo"
                                        />
                                    </a>
                                    <div className="bottom-0 flex items-center justify-center py-3 pt-0 pb-5 text-md text-[#05135e]">
                                        Powered by
                                        <a
                                            href="https://www.timdtech.com/?utm_source=client-software&utm_medium=referral&utm_campaign=tracking_campaign"
                                            target="_blank"
                                            className="hover:underline mx-2"
                                        >
                                            TimD – Tim Digital
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
