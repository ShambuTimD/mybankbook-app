<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class MiscSettings extends Settings
{
    public string $public_api_key = 'auto-generated';
    public string $app_playstore_url = 'https://play.google.com/store/apps/details?id=com.example';
    public string $app_ios_url = 'https://apps.apple.com/app/id1234567890';
    public static function group(): string
    {
        return 'misc';
    }
}
