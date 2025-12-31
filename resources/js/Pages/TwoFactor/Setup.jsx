import React from 'react';
import { useForm } from '@inertiajs/react';
import PageBreadcrumb from '@/Components/common/PageBreadCrumb';
import ComponentCard from '@/Components/common/ComponentCard';

// An icon can make the UI more visually appealing. We'll use an SVG for a shield.
const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.917l9 3 9-3A12.02 12.02 0 0021 5.984a11.955 11.955 0 01-4.382-3.001z" />
  </svg>
);

export default function Setup({ qr, secret, title }) {
  const { data, setData, post, processing, errors } = useForm({ code: '' });

  const submit = (e) => {
    e.preventDefault();
    post(route('2fa.verify'), {
      // Preserve scroll position on validation errors
      preserveScroll: true,
    });
  };

  return (<>
    <PageBreadcrumb pageTitle={title} />
    <ComponentCard title={title}  >
      <div className='flex justify-center'>
        <div className="w-full max-w-5xl bg-white rounded-2xl  p-8 md:p-12 space-y-8 ">

          {/* Header Section */}
          <div className="flex flex-col items-center text-center">
            <ShieldCheckIcon />
            <h1 className="text-3xl font-bold text-gray-800 mt-2">
              Two-Factor Authentication Setup
            </h1>
            <p className="text-gray-600 mt-2">
              Add an extra layer of security to your account.
            </p>
          </div>

          {/* Main content grid - responsive */}
          <div className="mt-8 grid md:grid-cols-2 gap-8 md:gap-16 items-start">

            {/* Left Side: QR Code and Secret */}
            <div className="space-y-6">
              <div className="text-center md:text-left">
                <h2 className="text-xl font-bold text-gray-700">
                  <span className="bg-indigo-500 text-white rounded-full h-8 w-8 inline-flex items-center justify-center mr-3">1</span>
                  Scan the QR Code
                </h2>
                <p className="text-gray-500 mt-2">
                  Use an authenticator app like Google Authenticator or Authy to scan this QR code.
                </p>
              </div>

              {/* Styled QR Code container */}
              <div className="flex justify-center bg-white p-4 border-4 border-gray-200 rounded-lg">
                <div dangerouslySetInnerHTML={{ __html: qr }} />
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500">Can't scan? Enter this code manually:</p>
                <code className="mt-2 inline-block bg-gray-100 text-gray-800 font-mono text-lg px-4 py-2 rounded-md tracking-wider">
                  {secret}
                </code>
              </div>
            </div>

            {/* Right Side: Verification Form */}
            <div className="space-y-6">
              <div className="text-center md:text-left">
                <h2 className="text-xl font-bold text-gray-700">
                  <span className="bg-indigo-500 text-white rounded-full h-8 w-8 inline-flex items-center justify-center mr-3">2</span>
                  Verify Your Device
                </h2>
                <p className="text-gray-500 mt-2">
                  Enter the 6-digit code from your authenticator app to complete the setup.
                </p>
              </div>

              <form onSubmit={submit} className="mt-4 space-y-6">
                <div>
                  <label htmlFor="code" className="sr-only">Verification Code</label>
                  <input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={data.code}
                    onChange={e => setData('code', e.target.value)}
                    autoComplete="one-time-code"
                    className="w-full px-4 py-3 text-lg text-center border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    maxLength="6"
                  />
                  {errors.code && (
                    <div className="flex items-center mt-2 text-red-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.code}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                >
                  {processing ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </ComponentCard>
  </>


  );
}