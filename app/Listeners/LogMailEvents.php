<?php

namespace App\Listeners;

use Illuminate\Mail\Events\MessageSending;
use Illuminate\Mail\Events\MessageSent;
use Illuminate\Support\Facades\Log;

class LogMailEvents
{
    public function handle($event): void
    {
        if ($event instanceof MessageSending) {
            $msg = $event->message; // Illuminate\Mail\Message
            Log::info('MAIL: MessageSending', self::extract($msg));
        } elseif ($event instanceof MessageSent) {
            $msg = $event->message; // Illuminate\Mail\Message
            Log::info('MAIL: MessageSent', self::extract($msg) + [
                'transport_note' => 'Laravel handed the message to the transport.',
            ]);
        }
    }

    private static function extract($illuminateMessage): array
    {
        try {
            $sym = $illuminateMessage->getSymfonyMessage(); // Symfony\Component\Mime\Email
            $a = fn($arr) => array_map('strval', $arr ?: []);

            $atts = [];
            foreach ($sym->getAttachments() as $att) {
                $atts[] = [
                    'name' => $att->getName(),
                    'content_type' => $att->getContentType(),
                ];
            }

            return [
                'subject'     => $sym->getSubject(),
                'from'        => $a($sym->getFrom()),
                'to'          => $a($sym->getTo()),
                'cc'          => $a($sym->getCc()),
                'bcc'         => $a($sym->getBcc()),
                'reply_to'    => $a($sym->getReplyTo()),
                'attachments' => $atts,
            ];
        } catch (\Throwable $e) {
            return ['extract_error' => $e->getMessage()];
        }
    }
}
