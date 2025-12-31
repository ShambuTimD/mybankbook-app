import { Head, Link, useForm } from "@inertiajs/react";
import { useState, useEffect } from "react";

import GuestLayout from "@/Layout/GuestLayout";
import InputLabel from "@/AuthComponents/InputLabel";
import TextInput from "@/AuthComponents/TextInput";
import InputError from "@/AuthComponents/InputError";
import PrimaryButton from "@/AuthComponents/PrimaryButton";
import Checkbox from "@/AuthComponents/Checkbox";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

import toast from "react-hot-toast";

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState("email");
    const [loginEmail, setLoginEmail] = useState("");

    const emailForm = useForm({ email: "" });
    const passwordForm = useForm({ email: "", password: "", remember: false });
    const otpForm = useForm({ email: "", code: "" });

    // Load Turnstile script
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        script.async = true;
        document.body.appendChild(script);
    }, []);

    // --- SUBMIT HANDLERS ---
    const checkEmail = (e) => {
        e.preventDefault();

        // Get Turnstile response
        const token = window.turnstile?.getResponse?.() || "";

        emailForm.post(route("login.check-email"), {
            preserveState: true,
            preserveScroll: true,
            data: {
                ...emailForm.data,
                "cf-turnstile-response": token,
            },
            onSuccess: (page) => {
                const result = page.props.status;
                setLoginEmail(emailForm.data.email);

                if (result === "password") {
                    passwordForm.setData("email", emailForm.data.email);
                    setStep("password");
                } else if (result === "otp") {
                    otpForm.setData("email", emailForm.data.email);
                    setStep("otp");
                } else {
                    emailForm.setError(
                        "email",
                        "No account found with that email address."
                    );
                }
            },
            onError: (errors) => {
                emailForm.setError(
                    "email",
                    errors.email || "An unexpected error occurred."
                );
            },
        });
    };

    const handlePasswordLogin = (e) => {
        e.preventDefault();
        passwordForm.data.email = loginEmail;

        passwordForm.post(route("login"), {
            onSuccess: () => toast.success("Logged in successfully"),
            onError: (errors) => {
                if (errors.unauthorized) toast.error(errors.unauthorized);
                else if (errors.email) toast.error(errors.email);
                else if (errors.password) toast.error(errors.password);
                else toast.error("Login failed.");
            },
            onFinish: () => passwordForm.reset("password"),
        });
    };

    const handleOtpLogin = (e) => {
        e.preventDefault();
        otpForm.post(route("login.verify-otp"), {
            onFinish: () => otpForm.reset("code"),
        });
    };

    const goBackToEmailStep = () => {
        setStep("email");
        passwordForm.reset();
        otpForm.reset();
        setLoginEmail("");
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {/* Step 1: Email */}
            {step === "email" && (
                <form onSubmit={checkEmail}>
                    <div>
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={emailForm.data.email}
                            onChange={(e) => emailForm.setData("email", e.target.value)}
                            className="mt-1 block w-full"
                            autoComplete="username"
                            isFocused
                            required
                            placeholder="Enter Your Email*"
                        />
                        <InputError
                            message={emailForm.errors.email}
                            className="mt-2"
                        />
                    </div>

                    {/* Turnstile widget */}
                    <div className="mt-4">
                        <div
                            className="cf-turnstile"
                            data-sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                        ></div>
                    </div>

                    <div className="mt-4 flex items-center justify-end submit_btn">
                        <PrimaryButton
                            className="w-full justify-center"
                            disabled={emailForm.processing}
                        >
                            Continue
                        </PrimaryButton>
                    </div>
                </form>
            )}

            {/* Step 2 header */}
            {step !== "email" && (
                <div className="mb-4">
                    <p className="text-sm text-gray-600">
                        Logging in as{" "}
                        <span className="font-semibold text-gray-800">{loginEmail}</span>
                    </p>
                    <button
                        type="button"
                        onClick={goBackToEmailStep}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Change
                    </button>
                </div>
            )}

            {/* Step 2A: Password */}
            {step === "password" && (
                <form onSubmit={handlePasswordLogin}>
                    <div className="mt-4">
                        <InputLabel htmlFor="password" value="Password" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={passwordForm.data.password}
                            onChange={(e) =>
                                passwordForm.setData("password", e.target.value)
                            }
                            className="mt-1 block w-full"
                            autoComplete="current-password"
                            isFocused
                            required
                        />
                        <InputError
                            message={passwordForm.errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-4 block">
                        <label className="flex items-center">
                            <Checkbox
                                name="remember"
                                checked={passwordForm.data.remember}
                                onChange={(e) =>
                                    passwordForm.setData("remember", e.target.checked)
                                }
                            />
                            <span className="ms-2 text-sm text-gray-600">
                                Remember me
                            </span>
                        </label>
                    </div>

                    <div className="mt-4 flex items-center justify-between submit_btn">
                        {canResetPassword && (
                            <Link
                                href={route("password.request")}
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Forgot password?
                            </Link>
                        )}
                        <PrimaryButton
                            className="ms-4"
                            disabled={passwordForm.processing}
                        >
                            Log in
                        </PrimaryButton>
                    </div>
                </form>
            )}

            {/* Step 2B: OTP */}
            {step === "otp" && (
                <form onSubmit={handleOtpLogin}>
                    <div className="mt-4 relative">
                        <InputLabel htmlFor="password" value="Password" />
                        <TextInput
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={passwordForm.data.password}
                            onChange={(e) =>
                                passwordForm.setData("password", e.target.value)
                            }
                            className="mt-1 block w-full pr-10"
                            autoComplete="current-password"
                            isFocused
                            required
                        />
                        <span
                            className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            <FontAwesomeIcon
                                icon={showPassword ? faEyeSlash : faEye}
                            />
                        </span>

                        <InputError
                            message={passwordForm.errors.password}
                            className="mt-2"
                        />
                    </div>
                    <div className="mt-4 flex items-center justify-end submit_btn">
                        <PrimaryButton
                            className="w-full justify-center"
                            disabled={otpForm.processing}
                        >
                            Verify & Log in
                        </PrimaryButton>
                    </div>
                </form>
            )}
        </GuestLayout>
    );
}
