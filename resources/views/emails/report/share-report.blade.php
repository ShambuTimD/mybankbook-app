<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medical Report - {{ config('app.name') }}</title>

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

        .email-content {
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 8px;
        }

        .email-content p {
            font-size: 15px;
            margin: 0 0 12px;
        }

        .email-content ul {
            margin: 10px 0;
            padding-left: 20px;
            font-size: 14px;
        }

        .email-content li {
            margin-bottom: 6px;
        }

        .message-box {
            margin: 16px 0;
            padding: 14px;
            background: #ffffff;
            border-left: 4px solid #2563eb;
            border-radius: 4px;
            font-size: 14px;
        }

        .email-footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
            text-align: center;
        }

        .subcopy {
            margin-top: 20px;
            font-size: 12px;
            color: #777;
            text-align: center;
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

        <p>Dear {{ $detail->full_name }},</p>

        <p>
            The medical report for the following applicant has been shared with you.
            Please find the attached report documents in this email.
        </p>

        <p><strong>Applicant Details:</strong></p>
        <ul>
            <li><strong>Reference No:</strong> {{ $detail->uarn }}</li>
            <li><strong>Applicant Name:</strong> {{ $detail->full_name }}</li>
            <li><strong>Company:</strong> {{ $detail->company_name ?? '-' }}</li>
            <li><strong>Office / Center:</strong> {{ $detail->office_name ?? '-' }}</li>
            <li><strong>Report Status:</strong> Report Shared</li>
        </ul>

        {{-- Share Message --}}
        @if(!empty($messageHtml))
            <div class="message-box">
                {!! $messageHtml !!}
            </div>
        @endif

        <p>
            If you have any questions or require further assistance, please feel free to contact us.
        </p>

        {{-- Signature --}}
        <p style="margin-top:20px;">
            <strong>Best Regards,</strong><br>
            <strong>{{ config('app.name') }}</strong>
        </p>

    </div>

    <!-- Footer -->
    <div class="subcopy">
        @include('emails.booking.footer', ['emailfooter' => $emailfooter ?? null])
        <br>
        © {{ date('Y') }} {{ config('app.name') }}
    </div>

</div>
</body>
</html>
