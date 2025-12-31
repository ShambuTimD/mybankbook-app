<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SubscriptionPlan;
use App\Models\SubscriptionPlanFeature;

class SubscriptionPlanFeatureSeeder extends Seeder
{
    public function run(): void
    {
        SubscriptionPlanFeature::truncate();

        $basic = SubscriptionPlan::where('slug', 'basic')->first();
        $pro = SubscriptionPlan::where('slug', 'pro')->first();
        $enterprise = SubscriptionPlan::where('slug', 'enterprise')->first();

        /* ==========================
           BASIC PLAN FEATURES
        ========================== */
        $basicFeatures = [
            'max_users'           => '3',
            'reports'             => 'true',
            'export_pdf'          => 'false',
            'export_excel'        => 'false',
            'api_access'          => 'false',
            'priority_support'    => 'false',
        ];

        foreach ($basicFeatures as $key => $value) {
            SubscriptionPlanFeature::create([
                'subscription_plan_id' => $basic->id,
                'feature_key'           => $key,
                'feature_value'         => $value,
            ]);
        }

        /* ==========================
           PRO PLAN FEATURES
        ========================== */
        $proFeatures = [
            'max_users'           => '10',
            'reports'             => 'true',
            'export_pdf'          => 'true',
            'export_excel'        => 'true',
            'api_access'          => 'false',
            'priority_support'    => 'true',
        ];

        foreach ($proFeatures as $key => $value) {
            SubscriptionPlanFeature::create([
                'subscription_plan_id' => $pro->id,
                'feature_key'           => $key,
                'feature_value'         => $value,
            ]);
        }

        /* ==========================
           ENTERPRISE PLAN FEATURES
        ========================== */
        $enterpriseFeatures = [
            'max_users'           => 'unlimited',
            'reports'             => 'true',
            'export_pdf'          => 'true',
            'export_excel'        => 'true',
            'api_access'          => 'true',
            'priority_support'    => 'true',
            'dedicated_manager'   => 'true',
            'custom_integrations' => 'true',
        ];

        foreach ($enterpriseFeatures as $key => $value) {
            SubscriptionPlanFeature::create([
                'subscription_plan_id' => $enterprise->id,
                'feature_key'           => $key,
                'feature_value'         => $value,
            ]);
        }
    }
}
