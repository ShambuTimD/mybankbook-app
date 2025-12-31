<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation - {{ config('app.name') }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }

        .email-container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }

        .email-header {
            text-align: center;
            margin-bottom: 20px;
        }

        .email-header img {
            max-height: 40px;
            width: auto;
        }

        .email-content {
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 8px;
        }

        .email-content p {
            font-size: 16px;
        }

        .email-content ul {
            margin: 10px 0;
            padding-left: 20px;
        }

        .email-footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
        }

        .email-footer a {
            color: #007bff;
            text-decoration: none;
            padding: 0 5px;
        }

        .email-footer a:hover {
            text-decoration: underline;
        }

        .subcopy {
            margin-top: 20px;
            font-size: 14px;
            color: #555;
        }
    </style>
</head>

<body>
    <div class="email-container">
        <!-- Header -->
        <div class="email-header">
            @include('emails.booking.header')
        </div>

        <!-- Content -->
        <div class="email-content">
            <p>Dear {{ $user_full_name }},</p>

            <p>Your booking for <strong>{{ $app_settings->company_short_name }} -
                    {{ $app_settings->application_name }}</strong> has been successfully submitted. One of our support
                executives will contact you shortly to provide more details.</p>

            <p><strong>Booking Details:</strong></p>
            <ul>
                <li><strong>Booking Reference No:</strong> {{ $booking_ref_no }}</li>
                <li><strong>Booking Status:</strong> Success - {{ \Illuminate\Support\Str::ucfirst($booking_status) }}
                </li>
                {{-- <li><strong>Request Date:</strong> ({{ $request_date }})->format('d M Y, h:i A')</li> --}}
                <li><strong>Appointment Request Date:</strong>
                    {{ \Carbon\Carbon::parse($request_date)->format('d M Y') }}</li>
                <li><strong>Company:</strong> {{ $company_name }} </li>
                <li><strong>Office/Center/Unit:</strong> {{ $office_name }} - {{ $office_address }}</li>
                <li><strong>Preferred Collection Type:</strong> {{ $pref_collection_mode }}</li>
                <li><strong>Total Applicants:</strong> {{ $total_applicants }}</li>
                <li><strong>Submitted By:</strong> {{ $user_full_name }} | {{ $user_phone }} | {{ $user_email }}
                </li>
                <li><strong>Submission Date:</strong> {{ $submission_date }}</li>

            </ul>


            <p>Thank you for using our Corporate Wellness Care Booking System.</p>

            {{-- <p>Best regards,<br>Corporate Wellness Care Team<br>{{ $company_name }}</p> --}}

            <!-- Signature -->
            @if (!empty($signature))
                <p class = "signature"><strong>Best Regards,</strong>
                    <br>
                    <strong>{{ $signature }}</strong>
                    {{-- <br> --}}
                    {{-- <strong>{{ $app_settings->company_n1ame }}</strong> --}}
                </p>
            @endif
        </div>

        <!-- Footer -->

        <div class="subcopy" style="text-align: center; font-size: 12px; color: #777; margin-top: 20px;">
            @include('emails.booking.footer', ['emailfooter' => $emailfooter])
            <br>
            © {{ date('Y') }} {{ $app_settings->company_name }}
        </div>

    </div>
</body>

</html>
