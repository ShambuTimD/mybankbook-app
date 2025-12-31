<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TestCategory;

class TestMasterController extends Controller
{
    /**
     * Category-wise test list for dropdown
     */
    public function index()
    {
        $categories = TestCategory::with(['tests' => function ($q) {
            $q->where('status', 'active')
                ->orderBy('test_name');
        }])
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }
}
