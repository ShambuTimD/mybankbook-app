<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        // ========================
        // ACTIVE / INACTIVE FLAGS
        // ========================
        $this->migrator->add('support.faq_active', true);
        $this->migrator->add('support.faq_enable', true);

        $this->migrator->add('support.ticket_active', true);
        $this->migrator->add('support.ticket_enable', true);

        $this->migrator->add('support.contact_active', true);
        $this->migrator->add('support.contact_enable', true);
        
        $this->migrator->add('support.chat_active', true);
        $this->migrator->add('support.chat_enable', true);

        // ========================
        // TITLES & DESCRIPTIONS
        // (Inserted only if missing)
        // ========================
        $this->migrator->add('support.faq', 'Frequently Asked Questions');
        $this->migrator->add('support.faq_desc', 'Find instant answers to common questions.');

        $this->migrator->add('support.ticket', 'Support Tickets');
        $this->migrator->add('support.ticket_desc', 'Raise, track, and manage your support tickets easily.');

        $this->migrator->add('support.contact', 'Contact Support');
        $this->migrator->add('support.contact_desc', 'Reach our support team for assistance anytime.');

        $this->migrator->add('support.chat', 'Instant Chat');
        $this->migrator->add('support.chat_desc', 'Chat with us instantly on WhatsApp for quick help.');
    }
};
