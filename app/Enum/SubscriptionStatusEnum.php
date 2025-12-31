<?php

namespace App\Enum;

enum SubscriptionStatusEnum: string
{
    case PENDING   = 'pending';
    case TRIAL     = 'trial';
    case ACTIVE    = 'active';
    case EXPIRED   = 'expired';
    case CANCELLED = 'cancelled';
}
