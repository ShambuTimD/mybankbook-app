<?php

namespace App\Notifications;

use App\Settings\AppSettings;
use App\Settings\CommunicationSettings;
use App\Settings\PageLinkSettings;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Log;

class BillUploadedSuccessNotification extends Notification
{
    use Queueable;

    protected $detail;
    protected $cc = [];
    protected $bcc = []; // Now always empty

    public function __construct($detail, array $cc = [], array $bcc = [])
    {
        $this->detail = $detail;
        $this->cc     = $cc;
        $this->bcc    = $bcc;
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        /** @var AppSettings $appSettings */
        $appSettings  = app(AppSettings::class);
        /** @var CommunicationSettings $commSettings */
        $commSettings = app(CommunicationSettings::class);
        /** @var PageLinkSettings $pageLinks */
        $pageLinks    = app(PageLinkSettings::class);

        $company = $this->detail->booking->company ?? null;
        $office  = $this->detail->booking->office ?? null;

        $subject = "Bill Uploaded Successfully – {$this->detail->full_name} ({$this->detail->uarn})";

        $mail = (new MailMessage)
            ->subject($subject)
            ->view('emails.bill.bill_uploaded_success', [
                'detail'      => $this->detail,
                'company'     => $company,
                'office'      => $office,
                'signature'   => $commSettings->email_signature ?? '',
                'app_settings'=> $appSettings,
                'emailfooter' => $pageLinks,
            ]);

        // ATTACH BILL
        $bill = $this->detail->getFirstMedia('bills');
        if ($bill) {
            $mail->attach($bill->getPath(), [
                'as'   => $bill->file_name,
                'mime' => $bill->mime_type,
            ]);
        }

        // ADD CC ONLY (no BCC)
        $cc = $this->cc;

        $mail->withSymfonyMessage(function (\Symfony\Component\Mime\Email $symfonyEmail) use ($cc) {

            foreach ($cc as $email) {
                $symfonyEmail->addCc($email);
            }

            // No BCC added
        });

        return $mail;
    }
}
