<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;

class SubscriptionPlanController extends Controller
{
    public function index()
    {
        return SubscriptionPlan::with('features')->get();
    }

    public function store(Request $request)
    {
        $plan = SubscriptionPlan::create($request->all());

        if ($request->features) {
            foreach ($request->features as $key => $value) {
                $plan->features()->create([
                    'feature_key'   => $key,
                    'feature_value' => $value,
                ]);
            }
        }

        return response()->json($plan, 201);
    }
}
