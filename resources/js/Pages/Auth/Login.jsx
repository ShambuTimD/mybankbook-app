import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

import GuestLayout from '@/Layout/GuestLayout';
import InputLabel from '@/AuthComponents/InputLabel';
import TextInput from '@/AuthComponents/TextInput';
import InputError from '@/AuthComponents/InputError';
import PrimaryButton from '@/AuthComponents/PrimaryButton';
import Checkbox from '@/AuthComponents/Checkbox';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';


export default function Login({ status, canResetPassword }) {
    // 'email' | 'password' | 'otp'
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState('email');
    // State to hold the email address after the first step for display
    const [loginEmail, setLoginEmail] = useState('');

    const emailForm = useForm({ email: '' });

    const passwordForm = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const otpForm = useForm({
        email: '',
        code: '',
    });

    // --- SUBMIT HANDLERS ---

    const checkEmail = (e) => {
        e.preventDefault();

        // CHANGED: Use the form's own post method. It's cleaner and handles processing state automatically.
        emailForm.post(route('login.check-email'), {
            preserveState: true,
            preserveScroll: true,
            onSuccess: (page) => {
                // The status from the backend is in page.props.flash.status or page.props.status
                const result = page.props.status;
                const email = page.props.email;
                setLoginEmail(emailForm.data.email);

                if (result === 'password') {
                    passwordForm.setData('email', emailForm.data.email);
                    setStep('password');
                } else if (result === 'otp') {
                    otpForm.setData('email', emailForm.data.email);
                    setStep('otp');
                } else {
                    // Handle the 'not_found' case from your controller
                    emailForm.setError('email', 'No account found with that email address.');
                }
            },
            onError: (errors) => {
                // This will handle validation errors if you add them to the checkEmail route
                emailForm.setError('email', errors.email || 'An unexpected error occurred.');
            },
        });
    };

    const handlePasswordLogin = (e) => {
        console.log('Submitting password login', passwordForm.data);
        e.preventDefault();
        passwordForm.data.email = loginEmail; // Ensure email is set for password login
        passwordForm.post(route('login'), {
            onFinish: () => passwordForm.reset('password'),
        });
    };

    const handleOtpLogin = (e) => {
        e.preventDefault();
        otpForm.post(route('login.verify-otp'), {
            onFinish: () => otpForm.reset('code'),
        });
    };

    // --- UI HELPERS ---

    const goBackToEmailStep = () => {
        setStep('email');
        // Reset forms to clear any old data or errors
        passwordForm.reset();
        otpForm.reset();
        setLoginEmail('');
    };

    // --- RENDER ---

    return (
        <GuestLayout>
            <Head title="Log in" />
            <div >
                {/* Step 1: Email Input */}
                {step === 'email' && (
                    <form onSubmit={checkEmail}>
                        <div>
                            {/* <InputLabel htmlFor="email" value="Email" className='dark:text-white ' /> */}
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={emailForm.data.email}
                                onChange={(e) => emailForm.setData('email', e.target.value)}
                                className="mt-1 block w-full"
                                autoComplete="username"
                                isFocused
                                required
                                placeholder="Enter Your Email*"
                            />
                            <InputError message={emailForm.errors.email} className="mt-2" />
                        </div>

                        <div className="mt-4 flex items-center justify-end submit_btn">
                            <PrimaryButton className="w-full justify-center" disabled={emailForm.processing}>
                                Continue
                            </PrimaryButton>
                        </div>
                    </form>
                )}

                {/* Shared Header for Password/OTP Steps */}
                {step !== 'email' && (
                    <div className="mb-4">
                        <p className="text-sm text-gray-600">
                            Logging in as <span className="font-semibold text-gray-800">{loginEmail}</span>
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

                {/* Step 2A: Password Login */}
                {step === 'password' && (
                    <form onSubmit={handlePasswordLogin}>
                        <div className="mt-4">
                            <InputLabel htmlFor="password" value="Password" />
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={passwordForm.data.password}
                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                className="mt-1 block w-full"
                                autoComplete="current-password"
                                isFocused // Focus the password field when it appears
                                required
                            />
                            <InputError message={passwordForm.errors.password} className="mt-2" />
                        </div>

                        <div className="mt-4 block">
                            <label className="flex items-center">
                                <Checkbox
                                    name="remember"
                                    checked={passwordForm.data.remember}
                                    onChange={(e) => passwordForm.setData('remember', e.target.checked)}
                                />
                                <span className="ms-2 text-sm text-gray-600">Remember me</span>
                            </label>
                        </div>

                        <div className="mt-4 flex items-center justify-between submit_btn">
                            {canResetPassword && (
                                // CHANGED: Use Inertia's Link component for SPA navigation
                                <Link
                                    href={route('password.request')}
                                    className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    Forgot password?
                                </Link>
                            )}
                            <PrimaryButton className="ms-4" disabled={passwordForm.processing}>
                                Log in
                            </PrimaryButton>
                        </div>
                    </form>
                )}

                {/* Step 2B: OTP Login */}
                {step === 'otp' && (
                    <form onSubmit={handleOtpLogin}>
                        <div className="mt-4 relative">
                            <InputLabel htmlFor="password" value="Password" />
                            <TextInput
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={passwordForm.data.password}
                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                className="mt-1 block w-full pr-10"
                                autoComplete="current-password"
                                isFocused
                                required
                            />
                            {/* Toggle Icon */}
                            <span
                                className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                            </span>

                            <InputError message={passwordForm.errors.password} className="mt-2" />
                        </div>
                        <div className="mt-4 flex items-center justify-end submit_btn">
                            <PrimaryButton className="w-full justify-center" disabled={otpForm.processing}>
                                Verify & Log in
                            </PrimaryButton>
                        </div>
                    </form>
                )}
            </div>
        </GuestLayout>
    );
}
