<?php

namespace App\Enum;

enum PaymentStatusEnum: string
{
    case PENDING  = 'pending';
    case SUCCESS  = 'success';
    case FAILED   = 'failed';
    case REFUNDED = 'refunded';
}
