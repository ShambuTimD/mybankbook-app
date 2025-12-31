<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class SupportSettings extends Settings
{
    public string $support_email_1 = 'support1@example.com';
    public string $support_email_2 = 'support2@example.com';
    public string $support_phone_1 = '+91-9999999999';
    public string $support_phone_2 = '+91-8888888888';
    public static function group(): string
    {
        return 'support';
    }
}