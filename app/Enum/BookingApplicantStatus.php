<?php

namespace App\Enum;

enum BookingApplicantStatus: string
{
    case NOTSTARTED = 'not_started';
    case SCHEDULED = 'scheduled';
    case ATTENDED = 'attended';
    case CANCELLED = 'cancelled';
    case NO_SHOW = 'no_show';

    public function label(): string
    {
        return match($this) {
            self::NOTSTARTED => 'Not Started',
            self::SCHEDULED => 'Scheduled',
            self::ATTENDED => 'Attended',
            self::CANCELLED => 'Cancelled',
            self::NO_SHOW => 'No Show',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
