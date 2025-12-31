<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Enum\PlanChangeTypeEnum;

class PlanUpgradeLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'old_plan_id',
        'new_plan_id',
        'change_type',
        'changed_at',
    ];

    protected $casts = [
        'change_type' => PlanChangeTypeEnum::class,
        'changed_at'  => 'datetime',
    ];
}
