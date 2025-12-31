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

class BookingFailedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $booking;
    protected $recipient;
    protected $companyName;
    protected $officeName;
    protected $totalApplicants;
    protected $submissionDate;
    protected $errorMessage;

    protected ?string $attachmentRelativePath;
    protected ?string $attachmentFilename;

    /** Optional explicit CC/BCC (array of emails) */
    protected array $cc;
    protected array $bcc;

    public function __construct(
        $booking = null,
        array $recipient = [],
        string $companyName = '',
        string $officeName = '',
        int $totalApplicants = 0,
        string $submissionDate = '',
        string $errorMessage = '',
        ?string $attachmentRelativePath = null,
        ?string $attachmentFilename = null,
        array $cc = [],
        array $bcc = []
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
        $this->cc = $cc;
        $this->bcc = $bcc;

        Log::info('BookingFailedNotification::__construct', [
            'booking_id' => $this->booking->id ?? null,
            'attach'     => $this->attachmentRelativePath,
            'as'         => $this->attachmentFilename,
        ]);
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        Log::info('BookingFailedNotification::toMail start', ['booking_id' => $this->booking->id ?? null]);

        /** @var AppSettings $appSettings */
        $appSettings  = app(AppSettings::class);
        /** @var CommunicationSettings $commSettings */
        $commSettings = app(CommunicationSettings::class);
        /** @var PageLinkSettings $pageLinks */
        $pageLinks    = app(PageLinkSettings::class);

        $fromEmail = $commSettings->email_from_address ?? config('mail.from.address');
        $fromName  = $commSettings->email_from_name    ?? config('mail.from.name');

        $brn     = $this->booking->brn ?? null;

        // inside toMail()

        $clientShort = str_replace('_', '', ($appSettings->company_short_name));
        $appShort = str_replace('_', '', ($appSettings->application_short_title));
        $sidRaw = $this->recipient['session_id']
            ?? ($this->booking->sid ?? null);
        $sid = $sidRaw ? str_replace('_', '', $sidRaw) : null;
        $office = str_replace('_', '', ($this->officeName ?: 'Office'));

        if ($sid) {
            $subject = "{$clientShort} - {$appShort} - Booking Failed - Ref No: {$sid} For {$office}";
        } else {
            $subject = "{$clientShort} - {$appShort} - Booking Failed For {$office}";
        }


        $empCount = (int)($this->booking->total_employees  ?? 0);
        $depCount = (int)($this->booking->total_dependents ?? 0);
        $totalLabel = ($empCount + $depCount) > 0
            ? ($empCount + $depCount) . " ({$empCount} Employees + {$depCount} Dependents)"
            : (string)((int)$this->totalApplicants);

        $msg = (new MailMessage)
            ->from($fromEmail, $fromName)
            ->subject($subject)
            ->view('emails.booking.failed', [
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
            ]);

        // Attachment (kept on disk; no deletion hook)
        if ($this->attachmentRelativePath) {
            $absolutePath = public_path($this->attachmentRelativePath);
            $asName       = $this->attachmentFilename ?: basename($absolutePath);
            if (is_file($absolutePath)) {
                $msg->attach($absolutePath, [
                    'as'   => $asName,
                    'mime' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ]);
                Log::info('BookingFailedNotification attached Excel', [
                    'path' => $absolutePath,
                    'as'   => $asName,
                ]);
            } else {
                Log::warning('BookingFailedNotification attachment missing', ['path' => $absolutePath]);
            }
        }

        // CC/BCC (reliable way on notifications)
        if (!empty($this->cc) || !empty($this->bcc)) {
            $cc  = $this->cc;
            $bcc = $this->bcc;
            $msg->withSymfonyMessage(function (\Symfony\Component\Mime\Email $email) use ($cc, $bcc) {
                foreach ($cc as $c)  $email->addCc($c);
                foreach ($bcc as $b) $email->addBcc($b);
            });
        }

        Log::info('BookingFailedNotification::toMail done', ['subject' => $subject]);
        return $msg;
    }

    /** Utility if you want to reuse parsing in controller */
    public static function parseEmailList($raw): array
    {
        if (empty($raw)) return [];
        $candidates = is_array($raw)
            ? $raw
            : (function ($s) {
                $s = trim((string)$s);
                $json = (str_starts_with($s, '[') && str_ends_with($s, ']')) ? json_decode($s, true) : null;
                return is_array($json) ? $json : preg_split('/[,\n;]+/', $s);
            })($raw);
        $candidates = array_map('trim', $candidates);
        $candidates = array_filter($candidates, fn($e) => filter_var($e, FILTER_VALIDATE_EMAIL));
        return array_values(array_unique($candidates));
    }
}
