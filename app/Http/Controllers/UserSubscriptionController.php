<?php

namespace App\Http\Controllers;

use App\Models\UserSubscription;
use App\Models\SubscriptionPlan;
use App\Enum\SubscriptionStatusEnum;
use Carbon\Carbon;
use Illuminate\Http\Request;

class UserSubscriptionController extends Controller
{
    public function subscribe(Request $request)
    {
        $plan = SubscriptionPlan::findOrFail($request->plan_id);

        $subscription = UserSubscription::create([
            'user_id'              => auth()->id(),
            'subscription_plan_id' => $plan->id,
            'start_date'           => now(),
            'end_date'             => $plan->duration_days
                ? now()->addDays($plan->duration_days)
                : null,
            'trial_ends_at'        => $plan->trial_days
                ? now()->addDays($plan->trial_days)
                : null,
            'status'               => $plan->trial_days
                ? SubscriptionStatusEnum::TRIAL
                : SubscriptionStatusEnum::ACTIVE,
        ]);

        return response()->json($subscription);
    }

    public function cancel(UserSubscription $subscription)
    {
        $subscription->update([
            'status'       => SubscriptionStatusEnum::CANCELLED,
            'cancelled_at' => now(),
            'auto_renew'   => false,
        ]);

        return response()->json(['message' => 'Subscription cancelled']);
    }
}
