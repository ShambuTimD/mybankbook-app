<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FinanceController extends Controller
{
    public function financialYears()
    {
        // STEP 1: Get min & max created_on from booking_master
        $range = DB::table('timd_hpbms_booking_master')
            ->whereNull('deleted_on')
            ->selectRaw('MIN(created_on) as first_date, MAX(created_on) as last_date')
            ->first();

        if (!$range->first_date) {
            return response()->json([
                'success' => true,
                'data' => [
                    'financial_years' => [],
                    'current_financial_year' => $this->getCurrentFY()
                ]
            ]);
        }

        $startDate = Carbon::parse($range->first_date);
        $endDate = Carbon::parse($range->last_date);

        // FY logic
        $startYear = $startDate->month >= 4 ? $startDate->year : $startDate->year - 1;
        $endYear   = $endDate->month >= 4 ? $endDate->year : $endDate->year - 1;

        $financialYears = [];

        for ($y = $startYear; $y <= $endYear; $y++) {
            $financialYears[] = $y . "-" . ($y + 1);
        }

        // CURRENT FY
        $currentFY = $this->getCurrentFY();

        // REMOVE current FY from list so it doesn't duplicate
        $financialYears = array_filter($financialYears, function ($fy) use ($currentFY) {
            return $fy !== $currentFY;
        });

        // Sort remaining in descending
        usort($financialYears, function ($a, $b) {
            $startA = intval(explode('-', $a)[0]);
            $startB = intval(explode('-', $b)[0]);
            return $startB - $startA;
        });

        // PREPEND current FY at top
        array_unshift($financialYears, $currentFY);

        return response()->json([
            'success' => true,
            'data' => [
                'financial_years' => $financialYears,
                'current_financial_year' => $currentFY
            ]
        ]);
    }

    private function getCurrentFY()
    {
        $now = Carbon::now();
        $year = $now->month >= 4 ? $now->year : $now->year - 1;
        return $year . "-" . ($year + 1);
    }
}
