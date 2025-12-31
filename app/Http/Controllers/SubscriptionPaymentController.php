<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionPayment;
use App\Enum\PaymentStatusEnum;
use Illuminate\Http\Request;

class SubscriptionPaymentController extends Controller
{
    public function store(Request $request)
    {
        return SubscriptionPayment::create([
            'user_subscription_id' => $request->subscription_id,
            'payment_reference'    => $request->payment_reference,
            'payment_gateway'      => $request->payment_gateway,
            'amount'               => $request->amount,
            'currency'             => $request->currency ?? 'INR',
            'payment_status'       => PaymentStatusEnum::SUCCESS,
            'paid_at'              => now(),
        ]);
    }
}
