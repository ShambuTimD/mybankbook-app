<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Enum\PaymentStatusEnum;

class SubscriptionPayment extends Model
{
    protected $fillable = [
        'user_subscription_id',
        'payment_reference',
        'payment_gateway',
        'amount',
        'currency',
        'payment_status',
        'paid_at',
    ];

    protected $casts = [
        'payment_status' => PaymentStatusEnum::class,
        'paid_at'        => 'datetime',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(UserSubscription::class, 'user_subscription_id');
    }
}
