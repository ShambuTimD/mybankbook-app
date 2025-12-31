<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bill Uploaded - {{ config('app.name') }}</title>

    <style>
        body {
            font-family: Arial, sans-serif;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f6f9;
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

        .email-content {
            padding: 20px;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0px 3px 10px rgba(0, 0, 0, 0.05);
        }

        .email-content p {
            font-size: 15px;
        }

        .email-content ul {
            margin: 10px 0;
            padding-left: 20px;
        }

        .section-box {
            background: #f8fafc;
            border-left: 4px solid #3b82f6;
            padding: 12px 15px;
            border-radius: 6px;
            margin: 18px 0;
        }

        .label {
            font-weight: bold;
            color: #1f2937;
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
        }
    </style>
</head>

<body>
    <div class="email-container">

        <!-- HEADER -->
        <div class="email-header">
            @include('emails.booking.header')
        </div>

        <!-- MAIN CONTENT -->
        <div class="email-content">

            <p>Dear {{ $detail->full_name }},</p>

            <p>
                Your bill has been <strong>successfully uploaded</strong>.
                A PDF copy of the bill is attached to this email for your reference.
            </p>

            @if (!empty($detail->bill_media_notes))
                <div class="section-box">
                    <p class="label">Bill Notes:</p>
                    <p>{{ $detail->bill_media_notes }}</p>
                </div>
            @endif


            <!-- APPLICANT DETAILS -->
            <h3 style="color:#1e3a8a;">Applicant Details</h3>
            <ul>
                <li><strong>Name:</strong> {{ $detail->full_name }}</li>
                <li><strong>UARN:</strong> {{ $detail->uarn }}</li>
                <li><strong>Email:</strong> {{ $detail->email }}</li>
                <li><strong>Phone:</strong> {{ $detail->phone }}</li>
                <li><strong>Applicant Type:</strong> {{ ucfirst($detail->applicant_type) }}</li>
            </ul>


            <!-- COMPANY DETAILS -->
            <h3 style="color:#1e3a8a;">Company Details</h3>
            <ul>
                @if ($company)
                    <li><strong>Company Name:</strong> {{ $company->name }}</li>
                @else
                    <li>No company details available.</li>
                @endif
            </ul>


            <!-- OFFICE DETAILS -->
            <h3 style="color:#1e3a8a;">Office / HR Information</h3>
            <ul>
                @if ($office)
                    <li><strong>Office:</strong> {{ $office->office_name }}</li>
                    {{-- <li><strong>Office Email:</strong> {{ $office->email ?? '-' }}</li>
                    <li><strong>HR Email:</strong> {{ $office->hr_email ?? '-' }}</li> --}}
                @else
                    <li>No office details available.</li>
                @endif
            </ul>

            <p>
                If you have any questions regarding this bill or need further assistance,
                feel free to reach out to our support team.
            </p>

            @if (!empty($signature))
                <p style="margin-top: 20px;">
                    <strong>Best Regards,</strong><br>
                    <strong>{{ $signature }}</strong>
                </p>
            @endif

        </div>

        <!-- FOOTER -->
        <div class="email-footer">
            @include('emails.booking.footer', ['emailfooter' => $emailfooter])
            <br>
            © {{ date('Y') }} {{ config('app.name') }}. All Rights Reserved.
        </div>

    </div>
</body>

</html>
