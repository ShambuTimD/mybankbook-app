<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class LocaleSettings extends Settings
{

      public string $default_language = 'EN';
    public string $timezone = 'Asia/Kolkata';
    public string $date_format = 'd/m/Y';
    public string $currency_symbol = '₹';
    public string $currency_position = 'left';
    public static function group(): string
    {
        return 'locale';
    }
}