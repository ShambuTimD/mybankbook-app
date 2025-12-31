<?php

namespace App\Enum;

enum BillingCycleEnum: string
{
    case MONTHLY = 'monthly';
    case YEARLY = 'yearly';
    case LIFETIME = 'lifetime';
}
