<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class SupportSettings extends Settings
{
    // ===========================
    //  ACTIVE / INACTIVE FLAGS
    // ===========================
    public bool $faq_active;
    public bool $faq_enable;

    public bool $ticket_active;
    public bool $ticket_enable;

    public bool $contact_active;
    public bool $contact_enable;

    public bool $chat_active;
    public bool $chat_enable;


    // ===========================
    //  SECTION TITLES & DESCRIPTIONS
    // ===========================
    public string $faq = 'Frequently Asked Questions';
    public string $faq_desc = 'Find instant answers to common questions.';

    public string $ticket = 'Support Tickets';
    public string $ticket_desc = 'Raise, track, and manage your support tickets easily.';

    public string $contact = 'Contact Support';
    public string $contact_desc = 'Reach our support team for assistance anytime.';

    public string $chat = 'Instant Chat';
    public string $chat_desc = 'Chat with us instantly on WhatsApp for quick help.';

    public static function group(): string
    {
        return 'support';
    }
}
