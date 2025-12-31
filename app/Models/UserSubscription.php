<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Enum\SubscriptionStatusEnum;
use Carbon\Carbon;

class UserSubscription extends Model
{
    protected $fillable = [
        'user_id',
        'subscription_plan_id',
        'start_date',
        'end_date',
        'trial_ends_at',
        'status',
        'auto_renew',
        'cancelled_at',
    ];

    protected $casts = [
        'status'     => SubscriptionStatusEnum::class,
        'auto_renew' => 'boolean',
        'start_date' => 'date',
        'end_date'   => 'date',
    ];

    /* ================================
       RELATIONSHIPS
    ================================ */

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SubscriptionPayment::class);
    }

    /* ================================
       HELPERS
    ================================ */

    public function isActive(): bool
    {
        return $this->status === SubscriptionStatusEnum::ACTIVE &&
            ($this->end_date === null || $this->end_date->isFuture());
    }

    public function hasFeature(string $featureKey): bool
    {
        return $this->plan
            ->features
            ->where('feature_key', $featureKey)
            ->whereIn('feature_value', ['true', '1'])
            ->isNotEmpty();
    }
}
