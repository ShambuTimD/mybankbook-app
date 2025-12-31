<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('default.application_name', 'MyBankBook');
        $this->migrator->add('default.application_short_title', 'MyBankBook');
        $this->migrator->add('default.application_version', '1.1');
        $this->migrator->add('default.company_name', 'MyBankBook');
        $this->migrator->add('default.company_short_name', 'MyBankBook');
        $this->migrator->add('default.application_short_logo', 'https://placehold.co/170x70?text=Logo');
        $this->migrator->add('default.application_big_logo', 'https://placehold.co/170x70?text=Logo');
        $this->migrator->add('default.application_favicon', 'https://placehold.co/170x70?text=Logo');
        $this->migrator->add('default.business_pmt_link', '#');
        $this->migrator->add('default.business_pmt_qr', 'https://placehold.co/60x60?text=ICO');
        $this->migrator->add('default.booking_open_offset_days', 1);
    }
};
