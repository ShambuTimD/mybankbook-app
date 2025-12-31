<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class DocumentSettings extends Settings
{
   public string $doc_default_size = 'A4';
    public string $bill_print_type = 'Thermal';
    public string $printer_alignment = 'Left';
    public int $printer_margin_mm = 5;
    public int $print_font_size = 12;

    public static function group(): string
    {
        return 'document';
    }
}