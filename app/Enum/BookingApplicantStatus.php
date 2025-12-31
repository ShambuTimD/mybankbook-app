<?php

namespace App\Enum;

enum BookingApplicantStatus: string
{
    case Scheduled = 'scheduled';
    case Attended = 'attended';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match($this) {
            self::Scheduled => 'Scheduled',
            self::Attended => 'Attended',
            self::Cancelled => 'Cancelled',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}