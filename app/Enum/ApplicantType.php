<?php

namespace App\Enum;

enum ApplicantType: string
{
    case Employee = 'employee';
    case Dependent = 'dependent';

    public function label(): string
    {
        return match($this) {
            self::Employee => 'Employee',
            self::Dependent => 'Dependent',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}