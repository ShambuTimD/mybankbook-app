<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use App\Settings\AppSettings;
use App\Settings\CommunicationSettings;
use App\Settings\PageLinkSettings;

class BookingFailed extends Mailable
{
    use Queueable, SerializesModels;

    public $booking;
    public $recipient;
    public $companyName;
    public $officeName;
    public $totalApplicants;
    public $submissionDate;
    public $errorMessage;

    public ?string $attachmentRelativePath = null;
    public ?string $attachmentFilename     = null;

    public function __construct(
        $booking = null,
        array $recipient = [],
        string $companyName = '',
        string $officeName = '',
        int $totalApplicants = 0,
        string $submissionDate = '',
        string $errorMessage = '',
        ?string $attachmentRelativePath = null,
        ?string $attachmentFilename = null
    ) {
        $this->booking                = $booking;
        $this->recipient              = $recipient;
        $this->companyName            = $companyName;
        $this->officeName             = $officeName;
        $this->totalApplicants        = $totalApplicants;
        $this->submissionDate         = $submissionDate;
        $this->errorMessage           = $errorMessage;
        $this->attachmentRelativePath = $attachmentRelativePath ? ltrim($attachmentRelativePath, '/') : null;
        $this->attachmentFilename     = $attachmentFilename;

        Log::warning('BookingFailed::__construct', [
            'booking_id'  => $this->booking->id ?? null,
            'attach_path' => $this->attachmentRelativePath,
            'attach_name' => $this->attachmentFilename,
        ]);
    }

    public function build()
    {
        Log::info('BookingFailed::build start', ['booking_id' => $this->booking->id ?? null]);

        $brn     = $this->booking->brn ?? null;
        $subject = "[{$this->companyName} | {$this->officeName}] Booking Failed";

        $appSettings  = app(AppSettings::class);
        $commSettings = app(CommunicationSettings::class);
        $pageLinks    = app(PageLinkSettings::class);

        $fromEmail = $commSettings->email_from_address ?? config('mail.from.address');
        $fromName  = $commSettings->email_from_name    ?? config('mail.from.name');

        $empCount   = (int) ($this->booking->total_employees  ?? 0);
        $depCount   = (int) ($this->booking->total_dependents ?? 0);
        $totalLabel = ($empCount + $depCount) > 0
            ? ($empCount + $depCount) . " ({$empCount} Employees + {$depCount} Dependents)"
            : (string) ((int) $this->totalApplicants);

        $viewData = [
            'user_first_name'  => explode(' ', trim($this->recipient['name'] ?? ''))[0] ?? '',
            'user_full_name'   => $this->recipient['name'] ?? '',
            'user_role'        => $this->recipient['role'] ?? '',
            'user_email'       => $this->recipient['email'] ?? '',
            'user_phone'       => $this->recipient['phone'] ?? '',
            'session_id'       => $this->recipient['session_id'] ?? '',
            'booking_ref_no'   => $brn ?? 'N/A',
            'company_name'     => $this->companyName,
            'office_name'      => $this->officeName,
            'total_applicants' => $totalLabel,
            'submission_date'  => $this->submissionDate,
            'request_date'     => $this->recipient['pref_appointment_date'] ?? '',
            'brand_name'       => config('app.name'),
            'app_settings'     => $appSettings,
            'emailfooter'      => $pageLinks,
            'support_email'    => $commSettings->support_email ?? 'support@example.com',
            'error_message'    => $this->errorMessage ?: 'Unknown error occurred.',
            'signature'        => $commSettings->email_signature ?? '',
        ];

        $mail = $this->from($fromEmail, $fromName)
                     ->subject($subject)
                     ->view('emails.booking.failed', $viewData);

        // Attach file if present (do NOT delete afterwards)
        if (!empty($this->attachmentRelativePath)) {
            $absolutePath = public_path($this->attachmentRelativePath);
            $asName       = $this->attachmentFilename ?: basename($absolutePath);

            if (is_file($absolutePath)) {
                $mail->attach($absolutePath, [
                    'as'   => $asName,
                    'mime' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ]);
                Log::info('BookingFailed attached Excel', [
                    'path' => $absolutePath,
                    'as'   => $asName,
                ]);
            } else {
                Log::warning('BookingFailed attachment not found', ['path' => $absolutePath]);
            }
        }

        Log::info('BookingFailed::build finished', ['subject' => $subject, 'brn' => $brn]);
        return $mail;
    }
}
