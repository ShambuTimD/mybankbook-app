<?php

namespace App\Enum;

enum PlanChangeTypeEnum: string
{
    case UPGRADE   = 'upgrade';
    case DOWNGRADE = 'downgrade';
    case RENEW     = 'renew';
}
