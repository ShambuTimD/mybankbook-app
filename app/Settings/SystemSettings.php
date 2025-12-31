<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class SystemSettings extends Settings
{
     public bool $maintenance_mode = false;
    public bool $debug_mode_enabled = false;
    public string $system_ver_text = 'v1.0.0';
    public string $system_server_info;


    public static function group(): string
    {
        return 'system';
    }
}