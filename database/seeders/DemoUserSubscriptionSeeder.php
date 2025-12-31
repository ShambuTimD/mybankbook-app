<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\UserSubscription;
use App\Models\SubscriptionPlan;
use App\Enum\SubscriptionStatusEnum;

class DemoUserSubscriptionSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::first();
        $plan = SubscriptionPlan::where('slug', 'pro')->first();

        if (! $user || ! $plan) {
            return;
        }

        UserSubscription::updateOrCreate(
            [
                'user_id' => $user->id,
            ],
            [
                'subscription_plan_id' => $plan->id,
                'start_date'           => now(),
                'end_date'             => now()->addDays($plan->duration_days),
                'status'               => SubscriptionStatusEnum::ACTIVE,
                'auto_renew'           => true,
            ]
        );
    }
}
