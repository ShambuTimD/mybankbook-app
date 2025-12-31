<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\SubscriptionPlan;
use App\Models\PlanUpgradeLog;
use App\Enum\BillingCycleEnum;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        // 1️⃣ Delete dependent FK records FIRST
        PlanUpgradeLog::query()->delete();

        // 2️⃣ Delete plans (NOT truncate)
        SubscriptionPlan::query()->delete();

        // 3️⃣ Reset auto-increment (optional but clean)
        DB::statement('ALTER TABLE subscription_plans AUTO_INCREMENT = 1');

        // 4️⃣ Insert plans
        SubscriptionPlan::insert([
            [
                'name'          => 'Basic',
                'slug'          => 'basic',
                'description'   => 'For small teams and early-stage businesses',
                'price'         => 0.00,
                'billing_cycle' => BillingCycleEnum::MONTHLY->value,
                'duration_days' => 30,
                'trial_days'    => 14,
                'is_popular'    => false,
                'status'        => 'active',
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            [
                'name'          => 'Pro',
                'slug'          => 'pro',
                'description'   => 'For growing businesses with advanced needs',
                'price'         => 999.00,
                'billing_cycle' => BillingCycleEnum::MONTHLY->value,
                'duration_days' => 30,
                'trial_days'    => 7,
                'is_popular'    => true,
                'status'        => 'active',
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
            [
                'name'          => 'Enterprise',
                'slug'          => 'enterprise',
                'description'   => 'Custom solution for large organizations',
                'price'         => 9999.00,
                'billing_cycle' => BillingCycleEnum::YEARLY->value,
                'duration_days' => 365,
                'trial_days'    => 0,
                'is_popular'    => false,
                'status'        => 'active',
                'created_at'    => now(),
                'updated_at'    => now(),
            ],
        ]);
    }
}
