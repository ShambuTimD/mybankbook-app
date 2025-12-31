<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class IntegrationSettings extends Settings
{
     public string $google_analytics_id = 'G-XXXXXXX';
    public bool $google_drive_enabled = true;
    public string $google_drive_api_key = 'drive_api_key';
    public bool $dropbox_enabled = false;
    public string $dropbox_access_token = 'dropbox_token';
    public string $slack_webhook_url = 'https://hooks.slack.com/...';
    public bool $recaptcha_enabled = true;
    public string $recaptcha_site_key = 'recaptcha_site_key';
    public string $recaptcha_secret_key = 'recaptcha_secret_key';

    public static function group(): string
    {
        return 'integration';
    }
}