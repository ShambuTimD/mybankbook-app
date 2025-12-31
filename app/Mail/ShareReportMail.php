<?php

namespace App\Mail;

use App\Settings\AppSettings;
use App\Settings\CommunicationSettings;
use App\Settings\PageLinkSettings;
use Illuminate\Mail\Mailable;

class ShareReportMail extends Mailable
{
    public $detail;

    public $messageHtml;

    public $reports;

    public $companyName;

    public $officeName;

    public function __construct($detail, $messageHtml, $reports, string $companyName,
        string $officeName, )
    {
        $this->detail = $detail;
        $this->messageHtml = $messageHtml;
        $this->reports = $reports;

        $this->companyName = $companyName;
        $this->officeName = $officeName;
    }

    public function build()
    {
        $appSettings = app(AppSettings::class);
        $commSettings = app(CommunicationSettings::class);
        $pageLinks = app(PageLinkSettings::class);

        $subject = "[{$this->companyName} | {$this->officeName}] Medical Report - Ref No: {$this->detail->uarn}";

        $mail = $this
            ->subject($subject)
            ->view('emails.report.share-report')
            ->with([
                'detail' => $this->detail,
                'messageHtml' => $this->messageHtml,
                'app_settings' => $appSettings,
                'emailfooter' => $pageLinks,
                'signature' => $commSettings->email_signature ?? '',
            ]);

        foreach ($this->reports as $report) {
            $mail->attachFromStorageDisk(
                $report['disk'],
                str_replace('/uploads/', '', parse_url($report['url'], PHP_URL_PATH)),
                $report['file_name']
            );
        }

        return $mail;
    }
}
