<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SubscriptionPlan;
use App\Models\SubscriptionPlanFeature;
use Yajra\DataTables\Facades\DataTables;

class SubscriptionController extends Controller
{
    /**
     * ===============================
     * INDEX
     * ===============================
     */
    public function index()
    {
        return inertia('Subscriptions/Index', [
            'title' => 'Subscription Plans',
            'billingCycles' => ['monthly', 'yearly', 'lifetime'],
        ]);
    }

    /**
     * ===============================
     * LIST (DATATABLE)
     * ===============================
     */
    public function list(Request $request)
    {
        $query = SubscriptionPlan::with('features');

        // 🔎 Search by plan name
        if ($request->filled('search_term')) {
            $query->where('name', 'like', '%' . $request->search_term . '%');
        }

        // 🎯 Filter by billing cycle
        if ($request->filled('billing_cycle')) {
            $query->where('billing_cycle', $request->billing_cycle);
        }

        // status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return DataTables::of($query)
            ->addColumn(
                'billing_cycle',
                fn($row) =>
                ucfirst($row->billing_cycle->value)
            )
            ->addColumn(
                'price',
                fn($row) =>
                '₹' . number_format($row->price, 2)
            )
            ->addColumn(
                'features_count',
                fn($row) =>
                $row->features->count()
            )
            ->addColumn(
                'status_badge',
                fn($row) =>
                $row->status === 'active'
                    ? '<span class="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Active</span>'
                    : '<span class="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-700">Inactive</span>'
            )
            ->addColumn('action', fn() => '') // handled in React
            ->rawColumns(['status_badge'])
            ->make(true);
    }

    /**
     * ===============================
     * VIEW
     * ===============================
     */
    public function show(SubscriptionPlan $subscriptionPlan)
    {
        $subscriptionPlan->load('features');

        return response()->json([
            'success' => true,
            'data' => $subscriptionPlan,
        ]);
    }

    /**
     * ===============================
     * EDIT PAGE
     * ===============================
     */
    public function edit(SubscriptionPlan $subscriptionPlan)
    {
        $subscriptionPlan->load('features');

        return inertia('Subscriptions/Plans/Edit', [
            'plan' => $subscriptionPlan,
        ]);
    }


    /**
     * ===============================
     * CREATE PAGE
     * ===============================
     */
    public function create()
    {
        return inertia('Subscriptions/Create', [
            'title' => 'Create Subscription Plan',
            'billingCycles' => [
                ['label' => 'Monthly', 'value' => 'monthly'],
                ['label' => 'Yearly', 'value' => 'yearly'],
                ['label' => 'Lifetime', 'value' => 'lifetime'],
            ],
            'statusOptions' => [
                ['label' => 'Active', 'value' => 'active'],
                ['label' => 'Inactive', 'value' => 'inactive'],
            ],
        ]);
    }

    /**
     * ===============================
     * STORE
     * ===============================
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:100',
            'slug'           => 'required|string|max:100|unique:subscription_plans,slug',
            'price'          => 'required|numeric|min:0',
            'billing_cycle'  => 'required|in:monthly,yearly,lifetime',
            'duration_days'  => 'nullable|integer|min:1',
            'trial_days'     => 'nullable|integer|min:0',
            'status'         => 'required|in:active,inactive',
            'features'       => 'nullable|array',
            'features.*.key' => 'required|string|max:100',
            'features.*.value' => 'nullable|string|max:100',
        ]);

        $plan = SubscriptionPlan::create($validated);

        if (!empty($validated['features'])) {
            foreach ($validated['features'] as $feature) {
                SubscriptionPlanFeature::create([
                    'subscription_plan_id' => $plan->id,
                    'feature_key'   => $feature['key'],
                    'feature_value' => $feature['value'],
                ]);
            }
        }

        return redirect()
            ->route('subscriptions.index')
            ->with('success', 'Subscription plan created successfully');
    }
}
