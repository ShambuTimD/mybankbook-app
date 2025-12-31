<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\BookingDetail;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    // Applicant counts: employees + dependents
    private function getApplicantUserSegment($currentUser, $dateStart = null, $dateEnd = null, $officeId = null)
    {
        $sql = "
        SELECT
            SUM(applicant_type = 'employee') AS total_employees,
            SUM(applicant_type = 'dependent') AS total_dependents,
            COUNT(*) AS total_enrolled
        FROM timd_hpbms_companies_booking_details bd
        JOIN timd_hpbms_booking_master b ON bd.booking_id = b.id
        WHERE bd.deleted_on IS NULL
          AND b.created_by = :uid
    ";

        $params = ['uid' => $currentUser->id];

        if (!empty($officeId) && $officeId !== 'all') {
            $sql .= " AND b.office_id = :officeId";
            $params['officeId'] = $officeId;
        }

        if ($dateStart) {
            $sql .= " AND bd.created_on >= :startDate";
            $params['startDate'] = $dateStart;
        }

        if ($dateEnd) {
            $sql .= " AND bd.created_on <= :endDate";
            $params['endDate'] = $dateEnd;
        }

        return DB::selectOne($sql, $params);
    }


    private function getApplicantStatusCounts($currentUser, $dateStart = null, $dateEnd = null, $officeId = null)
    {
        $sql = "
        SELECT
            COUNT(*) AS total_application,
            SUM(status = 'scheduled') AS scheduled_application,
            SUM(status = 'attended') AS attended_application,
            SUM(status = 'no_show') AS no_show_application,
            SUM(status = 'cancelled') AS cancelled_application
        FROM timd_hpbms_companies_booking_details bd
        JOIN timd_hpbms_booking_master b ON bd.booking_id = b.id
        WHERE bd.deleted_on IS NULL
          AND b.created_by = :uid
    ";

        $params = ['uid' => $currentUser->id];

        if (!empty($officeId) && $officeId !== 'all') {
            $sql .= " AND b.office_id = :officeId";
            $params['officeId'] = $officeId;
        }

        if ($dateStart) {
            $sql .= " AND bd.created_on >= :startDate";
            $params['startDate'] = $dateStart;
        }

        if ($dateEnd) {
            $sql .= " AND bd.created_on <= :endDate";
            $params['endDate'] = $dateEnd;
        }

        return DB::selectOne($sql, $params);
    }


    private function getReportStatusCounts($currentUser, $dateStart = null, $dateEnd = null, $officeId = null)
    {
        $sql = "
        SELECT
            COUNT(*) AS total_report,
            SUM(report_status = 'processing') AS processing_report,
            SUM(report_status = 'in_qc') AS in_qc_report,
            SUM(report_status = 'report_shared') AS shared_report
        FROM timd_hpbms_companies_booking_details bd
        JOIN timd_hpbms_booking_master b ON bd.booking_id = b.id
        WHERE bd.deleted_on IS NULL
          AND b.created_by = :uid
    ";

        $params = ['uid' => $currentUser->id];

        if (!empty($officeId) && $officeId !== 'all') {
            $sql .= " AND b.office_id = :officeId";
            $params['officeId'] = $officeId;
        }

        if ($dateStart) {
            $sql .= " AND bd.created_on >= :startDate";
            $params['startDate'] = $dateStart;
        }

        if ($dateEnd) {
            $sql .= " AND bd.created_on <= :endDate";
            $params['endDate'] = $dateEnd;
        }

        return DB::selectOne($sql, $params);
    }


    public function dashboardmetrics(Request $request)
    {
        $user = auth()->user();

        $officeId = $request->office_id;  // e.g. 3
        $filter = $request->filter ?? 'lifetime'; // e.g. 2024-2025, this_week, this_month

        $dateStart = null;
        $dateEnd = null;

        // --------------------------------------
        // 🔥 1) FINANCIAL YEAR: YYYY-YYYY
        // --------------------------------------
        if (preg_match('/^\d{4}-\d{4}$/', $filter)) {

            [$start, $end] = explode('-', $filter);

            // FY starts April 1 (YYYY) and ends March 31 (YYYY+1)
            $dateStart = Carbon::create($start, 4, 1)->startOfDay();
            $dateEnd = Carbon::create($end, 3, 31)->endOfDay();
        } else {

            // --------------------------------------
            // 🔥 2) WEEKLY / MONTHLY FILTERS
            // --------------------------------------
            $dateStart = match ($filter) {
                'this_week' => now()->startOfWeek(),
                'this_month' => now()->startOfMonth(),
                default => null          // lifetime
            };

            $dateEnd = $dateStart ? now()->endOfDay() : null;
        }

        // ------------------------------------------------------------
        // 🔥 BASE QUERY FOR BookingDetail + filters applied centrally
        // ------------------------------------------------------------
        $query = BookingDetail::query()
            ->whereNull('deleted_on')
            ->whereHas('booking', function ($q) use ($user) {
                $q->where('created_by', $user->id)
                    ->whereNotIn('booking_status', ['pending', 'cancelled']);
            });

        // --------------------------------------
        // 🔥 OFFICE FILTER USING booking->office_id
        // --------------------------------------
        if (! empty($officeId) && $officeId !== 'all') {
            $query->whereHas('booking', function ($q) use ($officeId) {
                $q->where('office_id', $officeId);
            });
        }

        // --------------------------------------
        // 🔥 DATE RANGE FILTER
        // --------------------------------------
        if ($dateStart && $dateEnd) {
            $query->whereBetween('created_on', [$dateStart, $dateEnd]);
        }

        // ------------------------------------------------------------
        // 2️⃣  Applicant Breakdown
        // ------------------------------------------------------------
        $employees = (clone $query)->where('applicant_type', 'employee')->count();
        $dependents = (clone $query)->where('applicant_type', 'dependent')->count();
        $totalEnrolled = $employees + $dependents;

        // ------------------------------------------------------------
        // 3️⃣ Application Status Counts
        // ------------------------------------------------------------
        $scheduled = (clone $query)->where('status', 'scheduled')->count();
        $confirmed = (clone $query)->where('status', 'confirmed')->count();
        $attended = (clone $query)->where('status', 'attended')->count();
        $noShow = (clone $query)->where('status', 'no_show')->count();
        $cancelHold = (clone $query)->whereIn('status', ['cancelled', 'on_hold'])->count();
        $completed = (clone $query)->where('status', 'completed')->count();

        $totalApplications =
            $scheduled +
            $confirmed +
            $attended +
            $noShow +
            $cancelHold +
            $completed;

        // ------------------------------------------------------------
        // 4️⃣ Reports Breakdown
        // ------------------------------------------------------------
        $totalReports = (clone $query)->whereNotNull('report_status')->count();
        $processing = (clone $query)->where('report_status', 'processing')->count();
        $inQC = (clone $query)->where('report_status', 'in_qc')->count();
        $uploaded = (clone $query)->where('report_status', 'report_uploaded')->count();
        $shared = (clone $query)->where('report_status', 'report_shared')->count();

        // ------------------------------------------------------------
        // 5️⃣ Dashboard Overview
        // ------------------------------------------------------------
        $dropped = $noShow + $cancelHold;


        // ------------------------------------------------------------
        // 6️⃣ Latest Booking (with office + date filters)
        // ------------------------------------------------------------
        $latest = (clone $query)
            ->orderByDesc('created_on')
            ->first();

        // ------------------------------------------------------------
        // 7️⃣ APPLY SAME FILTERS TO HELPERS
        // ------------------------------------------------------------
        $applicantSegment = $this->getApplicantUserSegment($user, $dateStart, $dateEnd, $officeId);
        $appStatus = $this->getApplicantStatusCounts($user, $dateStart, $dateEnd, $officeId);
        $reportStatus = $this->getReportStatusCounts($user, $dateStart, $dateEnd, $officeId);

        // ------------------------------------------------------------
        // 🔥 ATTENDANCE RATE CALCULATION
        // ------------------------------------------------------------
        $totalApplicantEnrolled = $totalEnrolled;

        $attendanceRate = $totalApplicantEnrolled > 0
            ? round(($attended / $totalApplicantEnrolled) * 100, 2)
            : 0;


        return response()->json([
            'success' => true,
            'message' => 'Dashboard metrics loaded',
            'data' => [

                // 1️⃣ Employee / Dependent
                'segments' => [
                    'employees' => $employees,
                    'dependents' => $dependents,
                    'total_enrolled' => $totalApplicantEnrolled,
                ],

                // 2️⃣ Applicant user segments
                'applicant_user_segment' => [
                    'total_employees' => (string) $employees,
                    'total_dependents' => (string) $dependents,
                    'total_enrolled' => (string) $totalApplicantEnrolled,
                ],

                // 3️⃣ Application Status
                'application_status' => [
                    'total_application' => (string) $totalApplications,
                    'scheduled_application' => (string) $scheduled,
                    'attended_application' => (string) $attended,
                    'no_show_application' => (string) $noShow,
                    'cancelled_application' => (string) $cancelHold,
                ],

                // 4️⃣ Reports
                'report_status' => [
                    'total_report' => (string) $totalReports,
                    'processing_report' => (string) $processing,
                    'in_qc_report' => (string) $inQC,
                    'shared_report' => (string) $shared,
                ],

                // 5️⃣ Overview
                'overview' => [
                    'attendance_rate' => $attendanceRate,
                    'total_enrolled' => (string) $totalApplicantEnrolled,
                    'total_attended' => $attended,
                    'dropped' => $dropped,
                ],

                // 6️⃣ Latest Booking
                'latest_booking' => $latest ? [
                    'id' => $latest->id,
                    'status' => $latest->status,
                    'report_status' => $latest->report_status,
                    'date' => $latest->created_on ? date('d M Y', strtotime($latest->created_on)) : null,
                    'employee' => $latest->full_name,
                ] : null,
            ],
        ]);
    }

    public function getGroupedSettings()
    {
        $settings = DB::table('settings')
            ->select('group', 'name', 'payload')
            ->orderBy('group')
            ->get();

        // Group by "group" field
        $grouped = $settings->groupBy('group')->map(function ($items) {
            $temp = [];
            foreach ($items as $item) {
                $temp[$item->name] = json_decode($item->payload, true);
            }

            return $temp;
        });

        return response()->json([
            'success' => true,
            'message' => 'Settings fetched successfully',
            'data' => $grouped,
        ]);
    }
}
