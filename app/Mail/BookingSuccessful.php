<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use App\Settings\AppSettings;
use App\Settings\CommunicationSettings;
use App\Settings\PageLinkSettings;

class BookingSuccessful extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $booking;
    public $recipient;
    public $companyName;
    public $officeName;
    public $totalApplicants;
    public $submissionDate;
    public $excelRelativePath;   // e.g. "uploads/booking/success/abc.xlsx" (relative to /public)
    public $excelFilename;
    public $requestDate;
    public $bookingStatus;

    public function __construct(
        $booking,
        array $recipient,
        string $companyName,
        string $officeName,
        int $totalApplicants,
        string $submissionDate,
        string $excelRelativePath,
        string $excelFilename
    ) {
        $this->booking           = $booking;
        $this->recipient         = $recipient;
        $this->companyName       = $companyName;
        $this->officeName        = $officeName;
        $this->totalApplicants   = $totalApplicants;
        $this->submissionDate    = $submissionDate;
        $this->excelRelativePath = ltrim($excelRelativePath, '/'); // keep it relative to public
        $this->excelFilename     = $excelFilename;
        $this->requestDate       = $booking->pref_appointment_date;
        $this->bookingStatus     = $booking->booking_status;

        Log::info('BookingSuccessful::__construct', [
            'booking_id' => $this->booking->id ?? null,
            'excel_path' => $this->excelRelativePath,
            'excel_file' => $this->excelFilename,
        ]);
    }

    public function build()
    {
        Log::info('BookingSuccessful::build start', ['booking_id' => $this->booking->id ?? null]);

        $ref     = $this->booking->brn ?? '-';
        $subject = "[{$this->companyName} | {$this->officeName}] Booking Successful – Ref No: {$ref}";

        $appSettings  = app(AppSettings::class);
        $commSettings = app(CommunicationSettings::class);
        $pageLinks    = app(PageLinkSettings::class);

        $empCount = (int) ($this->booking->total_employees ?? 0);
        $depCount = (int) ($this->booking->total_dependents ?? 0);
        $totalApplicantsLabel = ($empCount + $depCount) > 0
            ? ($empCount + $depCount) . ' (' .
            ($empCount === 1 ? '1 Employee' : "{$empCount} Employees") . ' + ' .
            ($depCount === 1 ? '1 Dependent' : "{$depCount} Dependents") . ')'
            : (string) ((int) $this->totalApplicants);

        $mail = $this->subject($subject)->markdown('emails.booking.success', [
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
        Log::info('Markdown view prepared for BookingSuccessful mail');

        // if (!empty($this->recipient['email'])) {
        //     $mail->to($this->recipient['email']);
        // }

        // CC/BCC
        $cc  = $this->parseEmailList($commSettings->email_cc_address ?? null);
        $bcc = $this->parseEmailList($commSettings->email_bcc_address ?? null);
        if ($cc)  $mail->cc($cc);
        if ($bcc) $mail->bcc($bcc);

        // Attachment (read from public/uploads/booking/success)
        $absolutePath = public_path($this->excelRelativePath);

        if (file_exists($absolutePath)) {
            $mail->attach($absolutePath, [
                'as'   => $this->excelFilename,
                'mime' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]);
            Log::info('Attachment added to BookingSuccessful mail', [
                'path' => $absolutePath,
                'file' => $this->excelFilename,
            ]);

            // Delete file after send
            $mail->withSwiftMessage(function () use ($absolutePath) {
                @unlink($absolutePath);
                Log::info('Attachment deleted after sending mail', [
                    'path' => $absolutePath,
                ]);
            });
        } else {
            Log::warning('Excel file not found for attachment', [
                'path' => $absolutePath,
            ]);
        }

        Log::info('BookingSuccessful::build done', ['subject' => $subject]);
        return $mail;
    }

    private function parseEmailList($raw): array
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
