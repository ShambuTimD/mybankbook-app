<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Log;
use App\Settings\AppSettings;
use App\Settings\CommunicationSettings;
use App\Settings\PageLinkSettings;

class BookingSuccessfulNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $booking;
    protected $recipient;
    protected $companyName;
    protected $officeName;
    protected $totalApplicants;
    protected $submissionDate;
    protected $excelRelativePath; // relative to /public
    protected $excelFilename;
    protected $requestDate;
    protected $bookingStatus;

    protected $cc = [];
    protected $bcc = [];

    public function __construct(
        $booking,
        array $recipient,
        string $companyName,
        string $officeName,
        int $totalApplicants,
        string $submissionDate,
        string $excelRelativePath,
        string $excelFilename,
        array $cc = [],
        array $bcc = []
    ) {
        $this->booking           = $booking;
        $this->recipient         = $recipient;
        $this->companyName       = $companyName;
        $this->officeName        = $officeName;
        $this->totalApplicants   = $totalApplicants;
        $this->submissionDate    = $submissionDate;
        $this->excelRelativePath = ltrim($excelRelativePath, '/');
        $this->excelFilename     = $excelFilename;
        $this->requestDate       = $booking->pref_appointment_date ?? null;
        $this->bookingStatus     = $booking->booking_status ?? null;

        $this->cc  = $cc;
        $this->bcc = $bcc;

        Log::info('BookingSuccessfulNotification::__construct', [
            'booking_id' => $this->booking->id ?? null,
            'excel_path' => $this->excelRelativePath,
            'excel_file' => $this->excelFilename,
            'cc'         => $this->cc,
            'bcc'        => $this->bcc,
        ]);
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        Log::info('BookingSuccessfulNotification::toMail start', [
            'booking_id' => $this->booking->id ?? null,
        ]);

        $ref     = $this->booking->brn ?? '-';




        /** @var AppSettings $appSettings */
        $appSettings  = app(AppSettings::class);
        /** @var CommunicationSettings $commSettings */
        $commSettings = app(CommunicationSettings::class);
        /** @var PageLinkSettings $pageLinks */
        $pageLinks    = app(PageLinkSettings::class);

        $clientShort = str_replace('_', '', ($appSettings->company_short_name));

        $appShort = str_replace('_', '', ($appSettings->application_short_title));
        $ref = str_replace('_', '', ($this->booking->brn ?? '-'));
        $office = str_replace('_', '', ($this->officeName ?: 'Office'));

        $subject = "{$clientShort} - {$appShort} - Booking Successful - Ref No: {$ref} For {$office}";

        $empCount = (int) ($this->booking->total_employees ?? 0);
        $depCount = (int) ($this->booking->total_dependents ?? 0);
        $totalApplicantsLabel = ($empCount + $depCount) > 0
            ? ($empCount + $depCount) . ' (' .
            ($empCount === 1 ? '1 Employee' : "{$empCount} Employees") . ' + ' .
            ($depCount === 1 ? '1 Dependent' : "{$depCount} Dependents") . ')'
            : (string) ((int) $this->totalApplicants);

        // Build the message
        $msg = (new MailMessage)
            ->subject($subject)
            ->from(
                $commSettings->email_from_address ?? config('mail.from.address'),
                $commSettings->email_from_name ?? config('mail.from.name')
            )
            ->markdown('emails.booking.success', [
                'user_first_name'  => explode(' ', trim($this->recipient['name'] ?? ''))[0] ?? '',
                'user_full_name'   => $this->recipient['name'] ?? '',
                'user_role'        => $this->recipient['role'] ?? '',
                'user_email'       => $this->recipient['email'] ?? '',
                'user_phone'       => $this->recipient['phone'] ?? '',
                'booking_ref_no'   => $ref,
                'booking_status'   => $this->bookingStatus,
                'company_name'     => $this->companyName,
                'office_name'      => $this->officeName,
                'total_applicants' => $totalApplicantsLabel,
                'submission_date'  => $this->submissionDate,
                'request_date'     => $this->requestDate,
                'brand_name'       => config('app.name'),
                'app_settings'     => $appSettings,
                'emailfooter'      => $pageLinks,
                'signature'        => $commSettings->email_signature ?? '',
            ]);

        // Attach (notifications support attachments via MailMessage->attach)
        $absolutePath = public_path($this->excelRelativePath);
        if (is_file($absolutePath)) {
            $msg->attach($absolutePath, [
                'as'   => $this->excelFilename,
                'mime' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]);
            Log::info('Attachment added in notification', [
                'path' => $absolutePath,
                'file' => $this->excelFilename,
            ]);
        } else {
            Log::warning('Notification attachment not found', ['path' => $absolutePath]);
        }

        // CC/BCC (use Symfony message hook for reliable cc/bcc on notifications)
        if (!empty($this->cc) || !empty($this->bcc)) {
            $cc  = $this->cc;
            $bcc = $this->bcc;

            $msg->withSymfonyMessage(function (\Symfony\Component\Mime\Email $symfonyEmail) use ($cc, $bcc) {
                foreach ($cc as $addr) {
                    $symfonyEmail->addCc($addr);
                }
                foreach ($bcc as $addr) {
                    $symfonyEmail->addBcc($addr);
                }
            });
        }

        Log::info('BookingSuccessfulNotification::toMail done', ['subject' => $subject]);
        return $msg;
    }

    /* Utility if you need it elsewhere */
    public static function parseEmailList($raw): array
    {
        if (empty($raw)) return [];
        $candidates = is_array($raw)
            ? $raw
            : (function ($s) {
                $s = trim((string) $s);
                $json = (str_starts_with($s, '[') && str_ends_with($s, ']')) ? json_decode($s, true) : null;
                return is_array($json) ? $json : preg_split('/[,\n;]+/', $s);
            })($raw);

        $candidates = array_map('trim', $candidates);
        $candidates = array_filter($candidates, fn($e) => filter_var($e, FILTER_VALIDATE_EMAIL));
        return array_values(array_unique($candidates));
    }
}
