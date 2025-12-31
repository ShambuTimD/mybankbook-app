<?php

namespace App\Http\Controllers\Frontend;

use App\Enum\BookingApplicantStatus;
use App\Enum\BookingStatus;
use App\Exports\BookingExport;
use App\Helpers\BookingHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\StoreBookingRequest;
use App\Models\Booking;
use App\Models\BookingDetail;
use App\Models\Company;
use App\Models\CompanyOffice;
use App\Models\CompanyUser;
use App\Models\Emp;
use App\Models\EmpDependent;
use App\Models\Test;
use App\Models\TestCategory;
use App\Models\User;
use App\Notifications\BookingFailedNotification;
use App\Notifications\BookingSuccessfulNotification;
use App\Settings\AppSettings;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str; // <-- ADDED
use Maatwebsite\Excel\Excel as ExcelFormat;
use Maatwebsite\Excel\Facades\Excel;

class BookingController extends Controller
{
    /**
     * GET /bookings metrics for dashboard.
     */
    public function dashboardmetrics()
    {
        $currentUser = auth()->user();

        $noShows = 0; // Placeholder if you track no-shows separately
        $totalBookings = Booking::where('created_by', $currentUser->id)->count();
        $upcomingBookings = Booking::where('created_by', $currentUser->id)->where('booking_status', 'pending')->count();
        $completedBookings = Booking::where('created_by', $currentUser->id)->where('booking_status', 'completed')->count();
        $cancelledBookings = Booking::where('created_by', $currentUser->id)->where('booking_status', 'cancelled')->count();

        return response()->json([
            'success' => true,
            'message' => 'Booking metrics retrieved successfully',
            'data' => [
                'total_bookings' => $totalBookings,
                'upcoming_bookings' => $upcomingBookings,
                'completed_bookings' => $completedBookings,
                'cancelled_bookings' => $cancelledBookings,
                'no_shows' => $noShows,
            ],
        ]);
    }

    /**
     * GET /bookings
     * Filters: company_id, office_id, booking_status, date_from, date_to, q (BRN).
     */
    public function index(Request $request)
    {
        $currentUser = $request->user();

        if (!$currentUser) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated user',
            ], 401);
        }

        $query = Booking::query()
            ->with([
                'company:id,name',
                'office:id,company_id,office_name,city,state',
                'requestedBy:id,name,email',
                // Ensure we fetch necessary fields for details
                'details:id,booking_id,uarn,full_name,applicant_type,email,phone,status,status_remarks,report_remarks,bill_media_notes,report_uploaded_on,bill_uploaded_on',
                'billMedia:id,file_name,mime_type,size,disk,collection_name',
                'createdBy:id,name,email,phone',
            ])
            ->where('created_by', $currentUser->id);

        // ✅ Booking Status Filter
        $status = strtolower(trim((string) $request->query('booking_status', 'all')));
        if ($status && $status !== 'all') {
            $query->whereRaw('LOWER(booking_status) = ?', [$status]);
        }

        // ✅ Company & Office Filter
        if ($request->company_id) {
            $query->where('company_id', $request->company_id);
        }

        if ($request->office_id && $request->office_id !== 'all') {
            $query->where('office_id', $request->office_id);
        }

        // =========================
        //  🎯  FINANCIAL YEAR FILTER
        // =========================
        $filter = $request->query('filter');

        if ($filter && preg_match('/^\d{4}-\d{4}$/', $filter)) {

            [$start, $end] = explode('-', $filter);

            $fyStart = Carbon::create($start, 4, 1)->startOfDay(); // Apr 1
            $fyEnd = Carbon::create($end, 3, 31)->endOfDay();    // Mar 31

            $query->whereBetween('created_on', [$fyStart, $fyEnd]);
        }

        // ✅ Search Filter
        if ($request->filled('q')) {
            $search = trim($request->q);
            $query->where(function ($q) use ($search) {
                $q->where('brn', 'like', "%{$search}%")
                    ->orWhereHas('company', fn($c) => $c->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('office', fn($o) => $o->where('office_name', 'like', "%{$search}%"));
            });
        }

        // ✅ Date Filter
        if (!empty($request->start_date) && !empty($request->end_date)) {
            $query->whereBetween('pref_appointment_date', [
                Carbon::parse($request->start_date)->startOfDay(),
                Carbon::parse($request->end_date)->endOfDay(),
            ]);
        } elseif (!empty($request->start_date)) {
            $query->where('pref_appointment_date', '>=', Carbon::parse($request->start_date)->startOfDay());
        } elseif (!empty($request->end_date)) {
            $query->where('pref_appointment_date', '<=', Carbon::parse($request->end_date)->endOfDay());
        }

        // ✅ Global Search (DataTables)
        $search = $request->input('search');
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('brn', 'like', "%{$search}%")
                    ->orWhereHas('company', fn($c) => $c->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('office', fn($o) => $o->where('office_name', 'like', "%{$search}%"));
            });
        }

        // ✅ Pagination
        $start = (int) $request->get('start', 0);
        $length = (int) $request->get('length', 10);
        $draw = (int) $request->get('draw', 1);

        $recordsTotal = Booking::where('created_by', $currentUser->id)->count();
        $recordsFiltered = (clone $query)->count();

        $bookings = $query
            ->orderByDesc('created_on')
            ->skip($start)
            ->take($length)
            ->get();

        // ✅ Transform output (simplify details)
        $bookings->transform(function ($booking) {
            return [
                'id' => $booking->id,
                'brn' => $booking->brn,
                'company' => $booking->company?->only(['id', 'name']),
                'office' => $booking->office?->only(['id', 'office_name']),
                'pref_appointment_date' => $booking->pref_appointment_date,
                'booking_status' => $booking->booking_status,
                'total_applicants' => ($booking->total_employees ?? 0) + ($booking->total_dependents ?? 0),
                'notes' => $booking->notes,
                'created_on' => $booking->created_on,
                'updated_on' => $booking->updated_on,
                'is_hold' => $booking->is_hold ?? 0,

                'bill_media' => $booking->billMedia ? [
                    'id' => $booking->billMedia->id,
                    'file_name' => $booking->billMedia->file_name,
                    'mime_type' => $booking->billMedia->mime_type,
                    'size' => $booking->billMedia->size,
                    'disk' => $booking->billMedia->disk,
                    'collection' => $booking->billMedia->collection_name,
                    'url' => $booking->billMedia->getFullUrl(),
                ] : null,

                // ⭐ ADD THIS BLOCK
                'created_by' => $booking->createdBy ? [
                    'id' => $booking->createdBy->id,
                    'name' => $booking->createdBy->name,
                    'email' => $booking->createdBy->email,
                    'phone' => $booking->createdBy->phome,
                ] : null,

                // ⭐ UPDATED DETAILS MAPPING FOR APPLICANT DATATABLE ⭐
                'details' => $booking->details?->map(function ($d) use ($booking) {
                    return [
                        // Fields required by React applicantColumns
                        'id' => $d->id,
                        'uarn' => $d->uarn ?? '-',
                        'full_name' => $d->full_name,
                        'email' => $d->email ?? '-',
                        'phone' => $d->phone ?? '-',
                        'applicant_type' => ucfirst($d->applicant_type), // Capitalize (Employee/Dependent)
                        'status' => ucfirst($d->status) ?? 'Pending',

                        // Injected from Parent Booking for the Table Columns
                        'company' => $booking->company->name ?? '-',
                        'office' => $booking->office->office_name ?? '-',

                        // Extra fields if needed for logic
                        'status_remarks' => $d->status_remarks,
                        'report_uploaded_on' => $d->report_uploaded_on,
                        'bill_uploaded_on' => $d->bill_uploaded_on,
                        'report_url' => $d->getFirstMediaUrl('reports'),
                        'bill_url' => $d->getFirstMediaUrl('bills'),
                        'bill_media_id' => $d->bill_media_id, // For download check
                        'media' => $d->media, // For download check logic
                    ];
                }),
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Booking list retrieved successfully',
            'draw' => $draw,
            'recordsTotal' => $recordsTotal,
            'recordsFiltered' => $recordsFiltered,
            'data' => $bookings,
        ]);
    }

    /**
     * GET /bookings/{booking}/applicants
     */
    public function bookingApplicants(Request $request, $bookingId)
    {
        try {
            $page = (int) ($request->page ?? 1);
            $perPage = (int) ($request->per_page ?? 10);
            $search = trim($request->search ?? '');

            // Load relations
            $query = BookingDetail::with([
                'booking',
                'booking.company',
                'booking.office',
                'employee',
                'dependent',
                'statusUpdatedBy',
                'reportUploadedBy',
            ])
                ->where('booking_id', $bookingId)
                ->active();

            // Search
            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $q->where('full_name', 'LIKE', "%{$search}%")
                        ->orWhere('employee_code', 'LIKE', "%{$search}%")
                        ->orWhere('dependent_id', 'LIKE', "%{$search}%")
                        ->orWhere('client_code', 'LIKE', "%{$search}%")
                        ->orWhere('status', 'LIKE', "%{$search}%")
                        ->orWhere('report_status', 'LIKE', "%{$search}%");
                });
            }

            $total = (clone $query)->count();

            $records = $query
                ->orderBy('id', 'DESC')
                ->skip(($page - 1) * $perPage)
                ->take($perPage)
                ->get();

            $data = $records->map(function ($row) {
                return [
                    'id' => $row->id,
                    'booking_id' => $row->booking_id,
                    'brn' => $row->booking->brn,
                    'uarn' => $row->uarn,

                    'full_name' => $row->full_name,
                    'applicant_type' => $row->applicant_type,

                    'employee' => $row->employee,
                    'dependent' => $row->dependent,

                    // 📌 Booking → Company & Office
                    'company_name' => $row->booking?->company?->name,
                    'office_name' => $row->booking?->office?->office_name,

                    // Status
                    'status' => $row->status,
                    'is_hold' => $row->booking->is_hold,
                    'status_remarks' => $row->status_remarks,
                    'status_reason_code' => $row->status_reason_code,
                    'status_updated_on' => $row->status_updated_on,
                    'status_updated_by' => $row->statusUpdatedBy?->first_name,

                    // Report
                    'report_status' => $row->report_status,
                    'report_remarks' => $row->report_remarks,
                    'report_uploaded_on' => $row->report_uploaded_on,
                    'report_uploaded_by' => $row->reportUploadedBy?->first_name,

                    // ⭐ NEW → Timestamped download URLs
                    'bill_url' => $row->hasMedia('bills')
                        ? route('booking.detail.download', [$row->id, 'bill'])
                        : null,

                    'report_url' => $row->hasMedia('reports')
                        ? route('booking.detail.download', [$row->id, 'report'])
                        : null,

                    // Other fields
                    'gender' => $row->gender,
                    'dob' => $row->dob,
                    'age' => $row->age,
                    'created_on' => $row->created_on,
                ];
            });

            return response()->json([
                'status' => 'success',
                'message' => 'Booking applicants fetched successfully.',
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'records' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }


    /**
     * GET /applicants/list
     */
    public function applicantList(Request $request)
    {
        $currentUser = $request->user();

        if (!$currentUser) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated user',
            ], 401);
        }

        try {
            $search = trim($request->search ?? '');
            $fyFilter = trim($request->filter ?? '');   // Financial Year
            $officeId = $request->office_id ?? null;    // Office Filter

            //-------------------------------------------------
            // ⭐ Base Query
            //-------------------------------------------------
            $query = BookingDetail::with([
                'booking',
                'booking.company',
                'booking.office',
                'employee',
                'dependent',
                'statusUpdatedBy',
                'reportUploadedBy',
            ])
                ->active()
                ->whereHas('booking', function ($q) use ($currentUser) {
                    $q->where('created_by', $currentUser->id);
                });

            //-------------------------------------------------
            // ⭐ Office Filter
            //-------------------------------------------------
            if (!empty($officeId)) {
                $query->whereHas('booking.office', function ($q) use ($officeId) {
                    $q->where('id', $officeId);
                });
            }

            //-------------------------------------------------
            // ⭐ Financial Year Filter
            //-------------------------------------------------
            if ($fyFilter !== '' && preg_match('/^\d{4}-\d{4}$/', $fyFilter)) {
                [$startYear, $endYear] = explode('-', $fyFilter);

                $fyStart = $startYear . '-04-01 00:00:00';
                $fyEnd = $endYear . '-03-31 23:59:59';

                $query->whereBetween('created_on', [$fyStart, $fyEnd]);
            }

            //-------------------------------------------------
            // ⭐ Search Filter
            //-------------------------------------------------
            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $q->where('full_name', 'LIKE', "%{$search}%")
                        ->orWhere('employee_code', 'LIKE', "%{$search}%")
                        ->orWhere('dependent_id', 'LIKE', "%{$search}%")
                        ->orWhere('uarn', 'LIKE', "%{$search}%")
                        ->orWhere('brn', 'LIKE', "%{$search}%")
                        ->orWhere('status', 'LIKE', "%{$search}%")
                        ->orWhere('report_status', 'LIKE', "%{$search}%");
                });
            }

            //-------------------------------------------------
            // ⭐ Latest 50 Records
            //-------------------------------------------------
            $records = $query
                ->orderBy('created_on', 'DESC')
                ->limit(50)
                ->get();

            $total = $records->count();

            //-------------------------------------------------
            // ⭐ Transform Output + Dynamic Download URLs
            //-------------------------------------------------
            $data = $records->map(function ($row) {

                return [
                    'id' => $row->id,
                    'booking_id' => $row->booking_id,
                    'brn' => $row->booking->brn,
                    'uarn' => $row->uarn,
                    'full_name' => $row->full_name,
                    'applicant_type' => $row->applicant_type,
                    'employee' => $row->employee,
                    'dependent' => $row->dependent,
                    'company_name' => $row->booking?->company?->name,
                    'office_name' => $row->booking?->office?->office_name,
                    'status' => $row->status,
                    'is_hold' => $row->booking->is_hold,
                    'status_remarks' => $row->status_remarks,
                    'status_reason_code' => $row->status_reason_code,
                    'status_updated_on' => optional($row->status_updated_on)->format('Y-m-d H:i:s'),
                    'status_updated_by' => $row->statusUpdatedBy?->first_name,
                    'report_status' => $row->report_status,
                    'report_remarks' => $row->report_remarks,
                    'report_uploaded_on' => optional($row->report_uploaded_on)->format('Y-m-d H:i:s'),
                    'report_uploaded_by' => $row->reportUploadedBy?->first_name,

                    // ⭐ Replace with timestamped download URL
                    'bill_url' => $row->hasMedia('bills')
                        ? route('booking.detail.download', [$row->id, 'bill'])
                        : null,

                    'report_url' => $row->hasMedia('reports')
                        ? route('booking.detail.download', [$row->id, 'report'])
                        : null,

                    'gender' => $row->gender,
                    'dob' => optional($row->dob)->format('Y-m-d'),
                    'age' => $row->age,
                    'created_on' => optional($row->created_on)->format('Y-m-d H:i'),
                ];
            });

            return response()->json([
                'status' => 'success',
                'message' => 'Latest applicants fetched successfully.',
                'filter_applied' => $fyFilter,
                'office_id' => $officeId,
                'total' => $total,
                'records' => $data,
            ]);
        } catch (\Exception $e) {

            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }



    /**
     * POST /bookings/store
     * Payload matches your example: employees[] with nested dependents[].
     * Returns the exact response structure you requested.
     */
    public function store(StoreBookingRequest $request)
    {
        // Log::info('Booking store started', ['user_id' => auth()->id()]);

        $validated = $request->validated();

        // Common context for emails/notifications
        $currentUser = auth()->user();
        $recipient = [
            'name' => $currentUser->name ?? 'User',
            'role' => $currentUser->role ?? 'User',
            'email' => $currentUser->email ?? null,
            'phone' => $currentUser->phone ?? null,
            'session_id' => $validated['session_id'] ?? null,
            'pref_appointment_date' => $validated['pref_appointment_date'] ?? null,
        ];
        $submissionDate = now()->format('d M Y, h:i A');

        // Attempted totals (used for failed path too)
        [$attemptEmp, $attemptDep, $attemptTotal] = $this->countAttemptedApplicants($validated);

        // Company/Office names for context
        $companyName = optional(Company::find($validated['company_id'] ?? null))->name ?? '';
        $officeNameOnlyById = optional(CompanyOffice::find($validated['office_id'] ?? null))->office_name ?? '';

        // Guard: office must belong to company
        $office = CompanyOffice::where('id', $validated['office_id'] ?? null)
            ->where('company_id', $validated['company_id'] ?? null)
            ->first();

        if (!$office) {
            // Build FAILED Excel (public/uploads/booking/failed)
            [$failedRel, $failedName] = $this->buildFailedExcelFromPayload(
                $validated,
                $companyName,
                $officeNameOnlyById,
                $currentUser->name ?? 'user'
            );
            $failedDownloadUrl = url($failedRel);

            // Send FAILED notification (SYNC)
            try {
                /** @var \App\Settings\CommunicationSettings $commSettings */
                $commSettings = app(\App\Settings\CommunicationSettings::class);

                $mainTo = $recipient['email']
                    ?? ($commSettings->support_email ?? config('mail.from.address'));

                $ccList = BookingFailedNotification::parseEmailList($commSettings->email_cc_address ?? null);
                $bccList = BookingFailedNotification::parseEmailList($commSettings->email_bcc_address ?? null);

                Notification::route('mail', $mainTo)->notify(
                    (new BookingFailedNotification(
                        null,
                        $recipient,
                        $companyName,
                        $officeNameOnlyById,
                        $attemptTotal,
                        $submissionDate,
                        'Office does not belong to the selected company.',
                        $failedRel,
                        $failedName,
                        $ccList,
                        $bccList
                    ))->onConnection('sync') // <--- FORCE SYNC
                );
            } catch (\Throwable $eNoti) {
                Log::error('Failed to send BookingFailed notification (office mismatch)', [
                    'error' => $eNoti->getMessage(),
                ]);
            }

            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Office does not belong to the selected company.',
                'excel_download' => $failedDownloadUrl,
            ], 422);
        }

        // Guard: company_user must belong to same company (if provided)
        if (!empty($validated['company_user_id'])) {
            $cu = CompanyUser::where('id', $validated['company_user_id'])
                ->where('company_id', $validated['company_id'])->first();

            if (!$cu) {
                [$failedRel, $failedName] = $this->buildFailedExcelFromPayload(
                    $validated,
                    $companyName,
                    $office->office_name ?? $officeNameOnlyById,
                    $currentUser->name ?? 'user'
                );
                $failedDownloadUrl = url($failedRel);

                // Send FAILED notification (SYNC)
                try {
                    /** @var \App\Settings\CommunicationSettings $commSettings */
                    $commSettings = app(\App\Settings\CommunicationSettings::class);

                    $mainTo = $recipient['email']
                        ?? ($commSettings->support_email ?? config('mail.from.address'));

                    $ccList = BookingFailedNotification::parseEmailList($commSettings->email_cc_address ?? null);
                    $bccList = BookingFailedNotification::parseEmailList($commSettings->email_bcc_address ?? null);

                    Notification::route('mail', $mainTo)->notify(
                        (new BookingFailedNotification(
                            null,
                            $recipient,
                            $companyName,
                            $office->office_name ?? $officeNameOnlyById,
                            $attemptTotal,
                            $submissionDate,
                            'Company user does not belong to the selected company.',
                            $failedRel,
                            $failedName,
                            $ccList,
                            $bccList
                        ))->onConnection('sync') // <--- FORCE SYNC
                    );
                } catch (\Throwable $eNoti) {
                    Log::error('Failed to send BookingFailed notification (company user mismatch)', [
                        'error' => $eNoti->getMessage(),
                    ]);
                }

                return response()->json([
                    'success' => false,
                    'status' => 'error',
                    'message' => 'Company user does not belong to the selected company.',
                    'excel_download' => $failedDownloadUrl,
                ], 422);
            }
        }

        $bookingMode = $validated['booking_mode'] ?? 'online_form';
        $prefDate = $validated['pref_appointment_date'] ?? null;

        $employeesCreatedUpdated = [];
        $empCount = 0;
        $depCount = 0;

        try {
            // ---- MANUAL FAILURE TRIGGER (safe for non-prod) ----
            if (!app()->isProduction() && $request->boolean('fail_test')) {
                Log::warning('Manual failure test triggered for Booking@store');
                throw new \Exception('Manual failure test');
            }
            // ----------------------------------------------------

            // --- TRANSACTION: create booking + applicants ---
            $booking = DB::transaction(function () use ($validated, $prefDate, &$employeesCreatedUpdated, &$empCount, &$depCount, $office) {

                // generateRefNo(companyId, officeId)
                $refNo = $this->generateRefNo($validated['company_id'], $validated['office_id']);

                $officeAddress = trim(
                    ($office->address_line_1 ?? '') . ' ' .
                    ($office->address_line_2 ?? '') . ', ' .
                    ($office->city ?? '') . ', ' .
                    ($office->state ?? '') . ' ' .
                    ($office->pincode ?? '')
                );

                $booking = Booking::create([
                    'company_id' => $validated['company_id'],
                    'office_id' => $validated['office_id'],
                    'office_address' => $officeAddress,
                    'company_user_id' => $validated['company_user_id'],
                    'preferred_collection_mode' => $validated['collection_mode'],
                    'brn' => $refNo,
                    'pref_appointment_date' => $prefDate,
                    'notes' => $validated['notes'] ?? null,
                    'created_by' => auth()->id(),
                    'booking_status' => BookingStatus::PENDING->value,
                ]);

                // Employees + Dependents
                foreach ($validated['employees'] as $empRow) {

                    [$emp, $empStatus] = $this->upsertEmployee($booking->company_id, $empRow, $booking);

                    // save employee and office relation
                    $this->assignEmployeeToOffice($emp, $booking->office_id);

                    $detailEmp = $this->detailFromEmployeeRow($empRow);
                    $detailEmp['dob'] = $this->parseDob($empRow['dob'] ?? null);
                    $detailEmp['age'] = $this->deriveAge($detailEmp['dob'], $empRow['age'] ?? null);
                    $detailEmp['medical_conditions'] = $this->toMedical($empRow['medical_conditions'] ?? $empRow['conditions'] ?? 'N/A');

                    // ✅ generate BDN for employee
                    $employeeUARN = BookingHelper::generateBDN($emp->name, 'employee');

                    // ✅ merge employee details
                    BookingDetail::create(array_merge($detailEmp, [
                        'booking_id' => $booking->id,
                        'emp_id' => $emp->id,
                        'dependent_id' => null,
                        'preferred_collection_mode' => $booking->preferred_collection_mode,
                        'employee_code' => $empRow['id'] ?? null,
                        'applicant_type' => 'employee',
                        'status' => BookingApplicantStatus::NOTSTARTED->value,
                        'brn' => $booking->brn,
                        'uarn' => $employeeUARN,
                        'home_address' => $emp->home_address ?? null,
                        'created_by' => auth()->id(),
                    ]));

                    $empCount++;

                    $empData = [
                        'type' => 'employee',
                        'id' => $emp->id,
                        'name' => $emp->name,
                        'email' => $emp->email,
                        'phone' => $emp->phone,
                        'status' => $empStatus,
                        'dependents' => [],
                    ];

                    // ✅ handle dependents
                    $dependents = $empRow['dependents'] ?? [];
                    $depIndex = 1;

                    foreach ($dependents as $depRow) {

                        [$dep, $depStatus] = $this->upsertDependent($emp, $depRow, $booking);

                        $detailDep = $this->detailFromDependentRow($depRow);
                        $detailDep['dob'] = $this->parseDob($depRow['dob'] ?? null);
                        $detailDep['age'] = $this->deriveAge($detailDep['dob'], $depRow['age'] ?? null);
                        $detailDep['medical_conditions'] = $this->toMedical($depRow['medical_conditions'] ?? $depRow['conditions'] ?? 'N/A');

                        // ✅ generate dependent BDN derived from employee’s BDN
                        $depUARN = BookingHelper::generateBDN($dep->name, 'dependent', $depIndex, $employeeUARN);

                        // ✅ merge dependent details
                        BookingDetail::create(array_merge($detailDep, [
                            'booking_id' => $booking->id,
                            'emp_id' => $emp->id,
                            'dependent_id' => $dep->id,
                            'employee_code' => $empRow['id'] ?? null,
                            'applicant_type' => 'dependent',
                            'status' => BookingApplicantStatus::NOTSTARTED->value,
                            'brn' => $booking->brn,
                            'uarn' => $depUARN,
                            'preferred_collection_mode' => $booking->preferred_collection_mode,
                            'home_address' => $dep->home_address ?? null,
                            'created_by' => auth()->id(),
                        ]));

                        $depCount++;
                        $depIndex++; // increment suffix for next dependent

                        $empData['dependents'][] = [
                            'type' => 'dependent',
                            'id' => $dep->id,
                            'name' => $dep->name,
                            'relation' => $dep->emp_relation,
                            'email' => $depRow['email'] ?? null,
                            'phone' => $depRow['phone'] ?? null,
                            'status' => $depStatus,
                        ];
                    }

                    $employeesCreatedUpdated[] = $empData;
                }

                $booking->update([
                    'total_employees' => $empCount,
                    'total_dependents' => $depCount,
                    'updated_by' => auth()->id(),
                ]);

                return $booking;
            });

            // =========================================================
            // ✅ NEW CODE: Create Notification after successful booking
            // =========================================================
            try {
                // import at top: use App\Models\Notification;
                $user = auth()->user();
                $companyName = optional($booking->company)->name ?? 'N/A';
                $officeName = optional($booking->office)->office_name ?? 'N/A';
                $bookingDate = optional($booking->pref_appointment_date)?->format('d M Y, h:i A');

                $message = "New booking created by {$user->name}";
                $longContent = sprintf(
                    'Booking #%s was created by %s (%s) for %s – %s on %s',
                    $booking->brn,
                    $user->name,
                    $user->email ?? 'no email',
                    $companyName,
                    $officeName,
                    $bookingDate
                );

                \App\Models\Notification::create([
                    'user_id' => $user->id,
                    'customer_id' => $booking->requested_by ?? null,
                    'message' => $message,
                    'long_content' => $longContent,
                    'date_time' => now(),
                    'is_read' => 'unread',
                    'notification_type' => 'system_gen',
                    'source' => 'booking',
                    'created_by' => $user->id,
                ]);
            } catch (\Throwable $e) {
                Log::error('Failed to create booking notification', [
                    'error' => $e->getMessage(),
                    'booking_id' => $booking->id ?? null,
                ]);
            }
            // =========================================================
            // ✅ /END of NEW CODE
            // =========================================================

            // SUCCESS export — write to public/uploads/booking/success
            $ts = now()->format('YmdHis');

            // Load app settings
            /** @var \App\Settings\AppSettings $appSettings */
            $appSettings = app(\App\Settings\AppSettings::class);

            // Helper to clean values (remove underscores, trim spaces)
            $clean = function ($value) {
                return str_replace('_', '', Str::slug($value ?? '', '_'));
            };

            $appShort = $clean($appSettings->application_short_title);
            $companyShort = $clean($appSettings->company_short_name);
            $officeSafe = $clean($office->office_name ?? $officeNameOnlyById);
            $statusSafe = $clean($booking->booking_status);
            $brnSafe = $clean($booking->brn);

            // Final filename format
            $excelFilename = "{$appShort}_{$companyShort}_{$officeSafe}_{$statusSafe}_{$brnSafe}_{$ts}.xls";

            $successRel = "uploads/booking/success/{$excelFilename}";
            $successAbsDir = public_path('uploads/booking/success');
            $successAbs = public_path($successRel);
            if (!is_dir($successAbsDir)) {
                @mkdir($successAbsDir, 0777, true);
            }

            // Save Excel in XLS format
            $export = new BookingExport($booking, $employeesCreatedUpdated);
            $binary = Excel::raw($export, \Maatwebsite\Excel\Excel::XLS);
            file_put_contents($successAbs, $binary);

            // ✅ Save path in booking master
            // $booking->update([
            //     'csv_path' => $successRel, // store relative path
            // ]);

            $excelDownloadUrl = url($successRel);

            // ===== SUCCESS NOTIFICATION (SYNC) =====
            try {
                /** @var \App\Settings\CommunicationSettings $commSettings */
                $commSettings = app(\App\Settings\CommunicationSettings::class);

                $totalApplicants = $empCount + $depCount;

                // Primary recipient; fallback to support/from address so CC/BCC still deliver
                $mainTo = $currentUser->email ?: ($commSettings->support_email ?? config('mail.from.address'));

                // CC/BCC from CommunicationSettings (CSV/JSON/array supported)
                $ccList = $this->parseEmailList($commSettings->email_cc_address ?? null);
                $bccList = $this->parseEmailList($commSettings->email_bcc_address ?? null);

                // Pre-send attachment presence check (optional)
                $absCheck = public_path($successRel);
                if (!file_exists($absCheck)) {
                    Log::warning('Attachment missing just before notify()', ['path' => $absCheck]);
                } else {
                    Log::info('Attachment present just before notify()', ['path' => $absCheck, 'size' => @filesize($absCheck)]);
                }

                Notification::route('mail', $mainTo)->notify(
                    (new BookingSuccessfulNotification(
                        $booking,
                        $recipient,
                        $companyName,
                        $office->office_name ?? $officeNameOnlyById,
                        $booking->office_address,
                        $totalApplicants,
                        $submissionDate,
                        $successRel,   // relative to /public
                        $excelFilename,
                        $ccList,
                        $bccList
                    ))->onConnection('sync') // <--- FORCE SYNC
                );
            } catch (\Symfony\Component\Mailer\Exception\TransportExceptionInterface $e) {
                Log::error('MAIL TRANSPORT ERROR (success notification)', [
                    'error' => $e->getMessage(),
                    'class' => get_class($e),
                ]);
            } catch (\Throwable $e) {
                Log::error('Failed to send booking success notification', [
                    'error' => $e->getMessage(),
                    'class' => get_class($e),
                ]);
            }
            // ===== /SUCCESS NOTIFICATION =====

            $user = CompanyUser::find($booking->created_by);

            return response()->json([
                'success' => true,
                'status' => 'success',
                'data' => [
                    'booking_id' => $booking->id,
                    'ref_no' => $booking->brn,
                    'request_date' => $booking->pref_appointment_date,
                    'booking_mode' => $bookingMode,
                    'user_id' => auth()->id(),
                    'company_id' => $booking->company_id,
                    'office_id' => $booking->office_id,
                    'submitted_by' => $user,
                    'booking_status' => $booking->booking_status,
                    'total_applicants' => $empCount + $depCount,
                    'applicants' => $employeesCreatedUpdated,
                    'excel_download' => $excelDownloadUrl,
                    'integrations' => [
                        'crm' => 'success',
                        'google_sheet' => 'success',
                    ],
                ],
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Booking store failed with exception', [
                'error' => $e->getMessage(),
                'class' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);

            // FAILED export — write to public/uploads/booking/failed
            [$failedRel, $failedName] = $this->buildFailedExcelFromPayload(
                $validated,
                $companyName,
                $office->office_name ?? $officeNameOnlyById,
                $currentUser->name ?? 'user'
            );
            $failedDownloadUrl = url($failedRel);

            // ✅ Save path in booking master ONLY if booking exists
            // if (!empty($booking) && $booking->exists) {
            //     $booking->update([
            //         'csv_path' => $failedRel,
            //     ]);
            // }

            // Send FAILED notification (SYNC)
            try {
                /** @var \App\Settings\CommunicationSettings $commSettings */
                $commSettings = app(\App\Settings\CommunicationSettings::class);

                $mainTo = $recipient['email']
                    ?? ($commSettings->support_email ?? config('mail.from.address'));

                $ccList = BookingFailedNotification::parseEmailList($commSettings->email_cc_address ?? null);
                $bccList = BookingFailedNotification::parseEmailList($commSettings->email_bcc_address ?? null);

                Notification::route('mail', $mainTo)->notify(
                    (new BookingFailedNotification(
                        null,
                        $recipient,
                        $companyName,
                        $office->office_name ?? $officeNameOnlyById,
                        $attemptTotal,
                        $submissionDate,
                        $e->getMessage() ?: 'Unknown error occurred.',
                        $failedRel,
                        $failedName,
                        $ccList,
                        $bccList
                    ))->onConnection('sync') // <--- FORCE SYNC
                );
            } catch (\Throwable $eNoti) {
                Log::error('Failed to send BookingFailed notification (exception path)', [
                    'error' => $eNoti->getMessage(),
                ]);
            }

            // =========================================================
            // ✅ NEW CODE: Create Notification after failed booking
            // =========================================================
            try {
                $user = auth()->user();
                $companyName = $companyName ?? 'N/A';
                $officeName = $office->office_name ?? $officeNameOnlyById ?? 'N/A';
                $errorMessage = $e->getMessage() ?: 'Unknown error occurred.';

                $message = "Booking failed for {$companyName}";
                $longContent = sprintf(
                    'Booking attempt by %s (%s) for %s – %s failed due to: %s',
                    $user->name,
                    $user->email ?? 'no email',
                    $companyName,
                    $officeName,
                    $errorMessage
                );

                \App\Models\Notification::create([
                    'user_id' => $user->id,
                    'customer_id' => null,
                    'message' => $message,
                    'long_content' => $longContent,
                    'date_time' => now(),
                    'is_read' => 'unread',
                    'notification_type' => 'system_gen',
                    'source' => 'booking',
                    'created_by' => $user->id,
                ]);
            } catch (\Throwable $eNotif) {
                Log::error('Failed to create booking failed notification', [
                    'error' => $eNotif->getMessage(),
                ]);
            }
            // =========================================================
            // ✅ /END of NEW CODE
            // =========================================================

            return response()->json([
                'success' => false,
                'status' => 'error',
                'data' => $e->getMessage() ?: 'Unknown error occurred.',
                'message' => 'Something went wrong while creating the booking.',
                'excel_download' => $failedDownloadUrl,
            ], 500);
        }
    }

    /**
     * GET /bookings/{id}
     */
    public function show($id)
    {
        $booking = Booking::with([
            'company:id,name,short_name',
            'office:id,company_id,office_name,city,state',
            'requestedBy:id,name,email,phone',
            'details' => fn($q) => $q->orderBy('id'),
            'details.employee:id,company_id,name,email,phone,gender,dob,age,designation,medical_conditions,remarks',
            'details.dependent:id,emp_id,emp_relation,name,gender,age',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $booking,
        ]);
    }

    // code by debasish

    public function publicBrnSummary(Request $request)
    {
        $request->validate([
            'brn' => ['required', 'string'],
            // 'sid' => ['nullable', 'string'], // optional, if you want to verify session
        ]);

        $brn = $request->string('brn')->trim();

        // Load booking with everything we need for the Thank You page
        $booking = Booking::with([
            'company:id,name,short_name',
            'office:id,company_id,office_name,city,state',
            'requestedBy:id,name,email,phone',
            'details' => fn($q) => $q->orderBy('id'),
            'details.employee:id,company_id,name,email,phone,gender,dob,age,designation,home_address',
            'details.dependent:id,emp_id,emp_relation,name,gender,age',
        ])->where('brn', $brn)->first();

        if (!$booking) {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Booking not found for the given reference number.',
            ], 404);
        }

        // Build employees[] with nested dependents[] from BookingDetail
        $employeesMap = [];  // emp_id => [ ...employee, dependents: [] ]

        foreach ($booking->details as $d) {
            if ($d->applicant_type === 'employee') {
                $emp = $d->employee;
                if (!$emp) {
                    continue;
                }

                // Try to pick home address from the detail row or employee record if you store it there
                $homeAddressFromDetail = $d->home_address ?? $d->address ?? null;
                $homeAddressFromEmployee = $emp->home_address ?? null;

                if (!isset($employeesMap[$emp->id])) {
                    $employeesMap[$emp->id] = [
                        'type' => 'employee',
                        'id' => $emp->id,
                        'name' => $emp->name,
                        'email' => $emp->email,
                        'phone' => $emp->phone,
                        'gender' => $emp->gender,
                        'age' => $emp->age,
                        'designation' => $emp->designation,
                        'home_address' => $homeAddressFromDetail ?? $homeAddressFromEmployee,
                        'dependents' => [],
                    ];
                } else {
                    // Merge home address if we have it and it's not yet set
                    $picked = $homeAddressFromDetail ?? $homeAddressFromEmployee;
                    if ($picked && empty($employeesMap[$emp->id]['home_address'])) {
                        $employeesMap[$emp->id]['home_address'] = $picked;
                    }
                }
            } elseif ($d->applicant_type === 'dependent') {
                $emp = $d->employee;      // parent employee
                $dep = $d->dependent;
                if (!$emp || !$dep) {
                    continue;
                }

                if (!isset($employeesMap[$emp->id])) {
                    // In case there is a dependent before we saw the employee detail row
                    $employeesMap[$emp->id] = [
                        'type' => 'employee',
                        'id' => $emp->id,
                        'name' => $emp->name,
                        'email' => $emp->email,
                        'phone' => $emp->phone,
                        'gender' => $emp->gender,
                        'age' => $emp->age,
                        'designation' => $emp->designation,
                        'home_address' => null,
                        'dependents' => [],
                    ];
                }

                $employeesMap[$emp->id]['dependents'][] = [
                    'type' => 'dependent',
                    'id' => $dep->id,
                    'name' => $dep->name,
                    'relation' => $dep->emp_relation,
                    'gender' => $dep->gender,
                    'age' => $dep->age,
                    // optional fields you may have in details/dependent:
                    'email' => $d->email ?? null,
                    'phone' => $d->phone ?? null,
                ];
            }
        }

        $employees = array_values($employeesMap);
        $totalEmployees = count($employees);
        $totalDependents = array_reduce($employees, function ($carry, $employee) {
            return $carry + count($employee['dependents'] ?? []);
        }, 0);

        $totalApplicants = $totalEmployees + $totalDependents;

        $formattedApplicantCount = "{$totalApplicants} ({$totalEmployees} Employee" . ($totalEmployees > 1 ? 's' : '') . " + {$totalDependents} Dependent" . ($totalDependents > 1 ? 's' : '') . ')';

        // Company/meta blocks expected by your ThankYouPage
        $companyBlock = [
            'company_name' => $booking->company?->name ?? '',
            'display_center' => $booking->office?->office_name ?? '',
            'hr_details' => [
                // put HR email if you store it somewhere; fallback to requestedBy
                'email' => $booking->requestedBy?->email,
            ],
        ];

        // Submitted by (your Thank You page shows first name & phone)
        $submittedBy = $booking->requestedBy?->name . ' | ' . $booking->requestedBy?->phone . ' | ' . $booking->requestedBy?->email;
        // $submittedBy = [
        //     'first_name'   => $booking->requestedBy?->name,
        //     'phone_number' => $booking->requestedBy?->phone,
        //     'email'        => $booking->requestedBy?->email,
        // ];

        // If you store a generated XLS path, expose it; else leave null.
        // Example if you ever persist it: $booking->csv_path
        $excelDownloadUrl = null;

        // Optional: if you want to try to find a success file by BRN:
        // $candidate = collect(glob(public_path("uploads/booking/success/*{$booking->brn}*.xls*")))->first();
        // if ($candidate) $excelDownloadUrl = url(str_replace(public_path().DIRECTORY_SEPARATOR, '', $candidate));

        // Optional: first applicant id (employee) for continuity with your old code
        $firstApplicantId = $employees[0]['id'] ?? null;

        $officedetails = $booking->office?->office_name . ' - ' . $booking->office_address;

        $prefMode = $booking->preferred_collection_mode;
        $displayMode = ($prefMode === 'at_clinic') ? 'At-Clinic' : (($prefMode === 'at_home') ? 'At-Home' : '');
        $submissiondate = $booking->created_on;

        $user = CompanyUser::with(['company', 'role'])
            ->where('id', $booking->created_by)
            ->first();

        // additional details
        $additionalDetails = [
            'office_name_header' => $booking->office?->office_name,
            'logged_user' => $user->role->role_title,
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'booking_ref' => $booking->brn,
                'booking_status' => $booking->booking_status,                 // e.g. 'pending'/'confirmed'
                'request_date' => optional($booking->pref_appointment_date)->format('Y-m-d') ?? $booking->pref_appointment_date,
                'company' => $booking->company?->name ?? '',
                'office' => $officedetails,
                'collection_mode' => $displayMode,         // ⬅️ top-level
                'applicant_summary' => $formattedApplicantCount,
                'submitted_by' => $submittedBy,
                'submitted_at' => $submissiondate,                           // set if you track a final date
                'booking_id' => $booking->id,                        // null or URL
                'additionial_details' => $additionalDetails,
            ],
        ]);
    }

    public function publicSummary(Request $request)
    {
        // Bookings
        $totalBookings = Booking::count();
        $completedBookings = Booking::where('booking_status', 'completed')->count();
        $inProgressBookings = Booking::where('booking_status', 'pending')->count();

        // Applicants
        $totalApplicants = BookingDetail::count();
        $completedApplicants = BookingDetail::where('status', 'attended')->count();
        $cancelledNoShowApplicants = BookingDetail::whereIn('status', ['cancelled', 'no_show'])->count();

        // Booking Status Ratio
        $completedBooking = "{$completedBookings}/{$totalBookings}";

        $completedBookingRatio = $totalBookings > 0
            ? round(($completedBookings / $totalBookings) * 100, 2)
            : 0;

        // Summary
        $date = Carbon::now()->format('d-m-Y');
        $totalApplicantToday = BookingDetail::whereDate('created_on', $date)->count();
        $totalApplicantCompletedToday = BookingDetail::whereDate('created_on', $date)->where('status', 'attended')->count();

        return response()->json([
            'success' => true,
            'message' => 'Booking summary retrieved successfully',
            'data' => [
                'total_bookings' => $totalBookings,
                'completed_bookings' => $completedBookings,
                'in_progress_bookings' => $inProgressBookings,
                'total_applicants' => $totalApplicants,
                'completed_applicants' => $completedApplicants,
                'cancelled_no_show_applicants' => $cancelledNoShowApplicants,
                // ✅ Show as ratio text
                'completed_booking' => $completedBooking,
                'completed_booking_ratio' => "{$completedBookingRatio}%",
                'today_date' => $date,
                'total_applicant_today' => $totalApplicantToday,
                'total_applicant_completed_today' => $totalApplicantCompletedToday,
            ],
        ]);
    }

    /**
     * PATCH /bookings/{id}/status
     * { "booking_status": "confirmed" | "cancelled" | "completed" }
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'booking_status' => ['required', 'in:pending,confirmed,cancelled,completed'],
        ]);

        $booking = Booking::findOrFail($id);

        $from = $booking->booking_status;
        $to = $request->booking_status;

        $allowed = [
            'pending' => ['confirmed', 'cancelled'],
            'confirmed' => ['completed', 'cancelled'],
            'cancelled' => [],
            'completed' => [],
        ];

        if (!in_array($to, $allowed[$from] ?? [], true)) {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => "Invalid status transition: {$from} → {$to}",
            ], 422);
        }

        $booking->update([
            'booking_status' => $to,
            'updated_by' => auth()->id(),
        ]);

        if ($to === 'cancelled') {
            BookingDetail::where('booking_id', $booking->id)
                ->where('status', 'scheduled')
                ->update(['status' => 'cancelled', 'updated_by' => auth()->id()]);
        }

        return response()->json([
            'success' => true,
            'status' => 'success',
            'message' => "Booking status updated to {$to}.",
            'data' => $booking->fresh('details'),
        ]);
    }

    // =========================================================
    // Helpers
    // =========================================================

    private function generateRefNo($companyId, $officeId)
    {
        // Get company code
        $companyCode = $this->getCompanyShort($companyId);
        Log::info('Company code for booking ref', [
            'company_id' => $companyId,
            'office_id' => $officeId,
            'code' => $companyCode,
        ]);

        // Current YYMM
        $yymm = now(config('app.timezone', 'Asia/Kolkata'))->format('ym');

        // Prefix example: KORP{COMP}{OFF}{YY}{MM}
        $prefix = "{$companyCode}{$companyId}{$officeId}{$yymm}";

        // Find last booking for the same company and office
        $lastBooking = Booking::where('company_id', $companyId)
            ->where('office_id', $officeId)
            ->orderByDesc('id')
            ->first();

        if ($lastBooking) {
            preg_match('/(\d{4})$/', $lastBooking->brn, $matches);
            $lastSeq = isset($matches[1]) ? intval($matches[1]) : 0;
            $sequence = str_pad($lastSeq + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $sequence = '0001';
        }

        return "{$prefix}{$sequence}";
    }

    /**
     * Fetch 4-char short name from settings; fallback to company.short_code or name.
     */
    private function getCompanyShort(int $companyId): string
    {
        try {
            /** @var AppSettings $settings */
            $settings = app(AppSettings::class);
            $fromSettings = $settings->company_short_name ?? $settings->company_short_code ?? null;
            if (!empty($fromSettings)) {
                return Str::of($fromSettings)->upper()->substr(0, 4)->padRight(4, 'X');
            }
        } catch (\Throwable $e) {
            // ignore and fallback
        }

        $company = Company::find($companyId);
        $candidate = $company?->short_code ?: $company?->short_name ?: $company?->name ?: 'COMP';

        return Str::of($candidate)->upper()->substr(0, 4)->padRight(4, 'X');
    }

    private function normalizeGender(?string $g): ?string
    {
        if (!$g) {
            return null;
        }
        $g = strtolower(trim($g));

        return in_array($g, ['male', 'female', 'other'], true) ? $g : null;
    }

    private function joinMedical(?array $conditions): ?string
    {
        if (!$conditions || !is_array($conditions)) {
            return null;
        }
        $clean = array_values(array_unique(array_map(fn($s) => trim((string) $s), $conditions)));

        return $clean ? implode(', ', $clean) : null;
    }

    private function parseDob(?string $dob): ?Carbon
    {
        return $dob ? Carbon::parse($dob) : null;
    }

    private function deriveAge(?Carbon $dob, ?int $providedAge = null): ?int
    {
        if ($providedAge !== null) {
            return $providedAge;
        }

        return $dob ? $dob->age : null;
    }

    /**
     * Upsert Employee by (email or phone) within company.
     * Returns [Emp, 'new_created'|'existing_updated'].
     */
    private function upsertEmployee(int $companyId, array $row, $booking): array
    {
        $email = $row['email'] ?? null;
        $phone = $row['phone'] ?? null;

        $dob = $this->parseDob($row['dob'] ?? null);
        $age = $this->deriveAge($dob, $row['age'] ?? null);

        $existing = null;
        if ($email) {
            $existing = Emp::where('company_id', $companyId)->where('email', $email)->first();
        }
        if (!$existing && $phone) {
            $existing = Emp::where('company_id', $companyId)->where('phone', $phone)->first();
        }

        $payload = [
            'company_id' => $companyId,
            'preferred_collection_mode' => $booking->preferred_collection_mode ?? null, // ✅ add
            'name' => $row['name'],
            'email' => $email,
            'phone' => $phone,
            'gender' => $this->normalizeGender($row['gender'] ?? null),
            'dob' => $dob,
            'age' => $age,
            'designation' => $row['designation'] ?? 'N/A',
            'home_address' => $row['home_address'] ?? null,
            'medical_conditions' => $row['medical_conditions'] ?? 'N/A',
            'remarks' => $row['remarks'] ?? 'N/A',
            'status' => 'active',
            'booking_id' => $booking->id,
        ];

        if ($existing) {
            $existing->fill($payload);
            $existing->updated_by = auth()->id();
            $existing->save();

            return [$existing->refresh(), 'existing_updated'];
        }

        $payload['created_by'] = auth()->id();
        $emp = Emp::create($payload);

        return [$emp, 'new_created'];
    }

    /**
     * Upsert Dependent for a given employee.
     * Returns [EmpDependent, 'new_created'|'existing_updated'].
     */
    private function upsertDependent(Emp $emp, array $row, $booking): array
    {
        $relation = $row['emp_relation'] ?? ($row['relation'] ?? 'N/A');
        $name = $row['name'] ?? '';

        $existing = EmpDependent::where('emp_id', $emp->id)
            ->where('name', $name)
            ->where('emp_relation', $relation)
            ->first();

        $payload = [
            'emp_id' => $emp->id,
            'preferred_collection_mode' => $booking->preferred_collection_mode ?? null, // ✅ save
            'home_address' => $emp->home_address, // ✅ copy employee home address
            'emp_relation' => $relation,
            'name' => $name,
            'gender' => $this->normalizeGender($row['gender'] ?? null),
            'age' => $row['age'] ?? null,
            'medical_conditions' => $row['medical_conditions'] ?? 'N/A',
            'remarks' => $row['remarks'] ?? 'N/A',
            'status' => 'active',
            'booking_id' => $booking->id,
        ];

        if ($existing) {
            $existing->fill($payload);
            $existing->updated_by = auth()->id();
            $existing->save();

            return [$existing->refresh(), 'existing_updated'];
        }

        $payload['created_by'] = auth()->id();
        $dep = EmpDependent::create($payload);

        return [$dep, 'new_created'];
    }

    private function detailFromEmployeeRow(array $row): array
    {
        $dob = $this->parseDob($row['dob'] ?? null);
        $age = $this->deriveAge($dob, isset($row['age']) && $row['age'] !== '' ? (int) $row['age'] : null);

        return [
            'full_name' => $row['name'] ?? 'N/A',
            'gender' => $this->normalizeGender($row['gender'] ?? null) ?? 'N/A',
            'dob' => $dob ?: null,
            'age' => $age ?? 'N/A',
            'email' => $row['email'] ?? 'N/A',
            'phone' => $row['phone'] ?? 'N/A',
            'designation' => !empty($row['designation']) ? $row['designation'] : 'N/A',
            // Employees don’t have relation, always set
            'emp_relation' => 'N/A',
            'medical_conditions' => !empty($row['medical_conditions']) ? json_encode($row['medical_conditions']) : 'N/A',
            'remarks' => !empty($row['remarks']) ? $row['remarks'] : 'N/A',
        ];
    }

    private function detailFromDependentRow(array $row): array
    {
        $dob = $this->parseDob($row['dob'] ?? null);
        $age = $this->deriveAge($dob, isset($row['age']) && $row['age'] !== '' ? (int) $row['age'] : null);

        // relation safe fallback
        $relation = $row['emp_relation'] ?? $row['relation'] ?? 'N/A';

        return [
            'full_name' => $row['name'] ?? 'N/A',
            'gender' => $this->normalizeGender($row['gender'] ?? null) ?? 'N/A',
            'dob' => $dob ?: null,
            'age' => $age ?? 'N/A',
            'email' => $row['email'] ?? 'N/A',
            'phone' => $row['phone'] ?? 'N/A',
            'designation' => !empty($row['designation']) ? $row['designation'] : 'N/A',
            'emp_relation' => $relation,
            'medical_conditions' => !empty($row['medical_conditions']) ? json_encode($row['medical_conditions']) : 'N/A',
            'remarks' => !empty($row['remarks']) ? $row['remarks'] : 'N/A',
        ];
    }

    private function toMedical(?array $val): ?string
    {
        if (!$val || !is_array($val)) {
            return null;
        }
        $clean = array_values(array_filter(array_map('trim', $val), fn($v) => $v !== ''));

        return count($clean) ? json_encode($clean) : null;
    }

    private function countAttemptedApplicants(array $validated): array
    {
        $empList = $validated['employees'] ?? [];
        $empCount = is_array($empList) ? count($empList) : 0;
        $depCount = 0;

        foreach ($empList as $e) {
            $depCount += is_array($e['dependents'] ?? null) ? count($e['dependents']) : 0;
        }

        return [$empCount, $depCount, $empCount + $depCount];
    }

    /**
     * Build a simple but well-formatted Excel for FAILED submissions.
     * Writes DIRECTLY to public/uploads/booking/failed (same logic as success).
     * Returns [string $relativePublicPath, string $filename].
     */
    private function buildFailedExcelFromPayload(array $validated, string $companyName, string $officeName, string $userName): array
    {
        // helper: join medical conditions
        $joinMed = function ($val) {
            if (is_array($val)) {
                return implode(', ', array_filter(array_map('trim', $val), fn($v) => $v !== ''));
            }

            return $val ? trim((string) $val) : null;
        };

        // helper: convert date string -> Excel serial (so formatting applies)
        $toExcelDate = function ($dateStr) {
            if (empty($dateStr)) {
                return null;
            }
            try {
                $c = \Carbon\Carbon::parse($dateStr);

                return \PhpOffice\PhpSpreadsheet\Shared\Date::dateTimeToExcel($c);
            } catch (\Throwable $e) {
                return null;
            }
        };

        // Headers (A1:W1)
        $headers = [
            'Record Type',
            'Employee Name',
            'Employee Email',
            'Employee Phone',
            'Employee Gender',
            'Employee DOB',
            'Employee Age',
            'Employee Designation',
            'Dependent Relation',
            'Dependent Name',
            'Dependent Email',
            'Dependent Phone',
            'Dependent DOB',
            'Dependent Age',
            'Medical Conditions',
            'Remarks',
            'Company ID',
            'Company Name',
            'Office ID',
            'Office Name',
            'Booking Mode',
            'Preferred Appointment Date',
            'Notes',
        ];

        // Data rows (WITHOUT header; headings provided via WithHeadings)
        $rows = [];
        $employees = $validated['employees'] ?? [];

        foreach ($employees as $emp) {
            $empDobExcel = $toExcelDate($emp['dob'] ?? null);
            $empAge = $emp['age'] ?? null;
            $empMed = $joinMed($emp['medical_conditions'] ?? ($emp['conditions'] ?? 'N/A'));

            // Employee row (no dependent)
            $rows[] = [
                'employee',
                $emp['name'] ?? null,
                $emp['email'] ?? null,
                $emp['phone'] ?? null,
                $emp['gender'] ?? null,
                $empDobExcel,             // F date
                is_numeric($empAge) ? (int) $empAge : null, // G number
                $emp['designation'] ?? 'N/A',
                null,
                null,
                null,
                null,
                null,
                null,
                $empMed,                  // O
                $emp['remarks'] ?? 'N/A',  // P
                $validated['company_id'] ?? null, // Q
                $companyName ?: null,     // R
                $validated['office_id'] ?? null,  // S
                $officeName ?: null,      // T
                $validated['booking_mode'] ?? null,          // U
                $toExcelDate($validated['pref_appointment_date'] ?? null), // V date
                $validated['notes'] ?? null,                 // W
            ];

            // Dependent rows (repeat employee info for context)
            $deps = $emp['dependents'] ?? [];
            foreach ($deps as $dep) {
                $depDobExcel = $toExcelDate($dep['dob'] ?? null);
                $depAge = $dep['age'] ?? null;
                $depMed = $joinMed($dep['medical_conditions'] ?? ($dep['conditions'] ?? 'N/A'));

                $rows[] = [
                    'dependent',
                    $emp['name'] ?? null,
                    $emp['email'] ?? null,
                    $emp['phone'] ?? null,
                    null,
                    $empDobExcel,                 // M date
                    is_numeric($empAge) ? (int) $empAge : null, // N number
                    $emp['designation'] ?? 'N/A',  // H
                    $dep['relation'] ?? ($dep['emp_relation'] ?? 'N/A'), // I
                    $dep['name'] ?? null,         // J
                    $dep['email'] ?? null,        // K
                    $dep['phone'] ?? null,        // L
                    $depDobExcel,                 // M date
                    is_numeric($depAge) ? (int) $depAge : null, // N number
                    $depMed,                      // O
                    $dep['remarks'] ?? 'N/A',      // P
                    $validated['company_id'] ?? null, // Q
                    $companyName ?: null,         // R
                    $validated['office_id'] ?? null,  // S
                    $officeName ?: null,          // T
                    $validated['booking_mode'] ?? null,          // U
                    $toExcelDate($validated['pref_appointment_date'] ?? null), // V date
                    $validated['notes'] ?? null,  // W
                ];
            }
        }

        // If no employees present, still output one meta row
        if (!$rows) {
            $rows[] = [
                'payload',
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                $validated['notes'] ?? null, // O used just to carry notes
                null,
                $validated['company_id'] ?? null,
                $companyName ?: null,
                $validated['office_id'] ?? null,
                $officeName ?: null,
                $validated['booking_mode'] ?? null,
                $toExcelDate($validated['pref_appointment_date'] ?? null),
                $validated['notes'] ?? null,
            ];
        }

        // Filename & public path (SAME pattern as success)
        $ts = now()->format('YmdHis');

        // Load app settings
        /** @var \App\Settings\AppSettings $appSettings */
        $appSettings = app(\App\Settings\AppSettings::class);

        // Helper to clean values (remove internal underscores, spaces normalized)
        $clean = function ($value) {
            if (!$value) {
                return null;
            }

            return str_replace('_', '', \Illuminate\Support\Str::slug($value, '_'));
        };

        $appShort = $clean($appSettings->application_short_title);
        $companyShort = $clean($appSettings->company_short_name);
        $officeSafe = $clean($officeName);
        $statusSafe = 'failed'; // fixed status for this export
        $brnSafe = $clean($validated['brn'] ?? $validated['session_id'] ?? null); // optional BRN/SID

        // Collect parts, remove null/empty
        $parts = array_filter([$appShort, $companyShort, $officeSafe, $statusSafe, $brnSafe, $ts]);

        // Join with underscores
        $filename = implode('_', $parts) . '.xls';

        // Paths
        $relative = "uploads/booking/failed/{$filename}";
        $absDir = public_path('uploads/booking/failed');
        $absPath = public_path($relative);
        if (!is_dir($absDir)) {
            @mkdir($absDir, 0777, true);
        }

        // Build export with headings + styles
        $export = new class ($rows, $headers) implements \Maatwebsite\Excel\Concerns\FromArray, \Maatwebsite\Excel\Concerns\ShouldAutoSize, \Maatwebsite\Excel\Concerns\WithColumnFormatting, \Maatwebsite\Excel\Concerns\WithEvents, \Maatwebsite\Excel\Concerns\WithHeadings {
            private array $rows;

            private array $headers;

            public function __construct(array $rows, array $headers)
            {
                $this->rows = $rows;
                $this->headers = $headers;
            }

            public function array(): array
            {
                return $this->rows;
            }

            public function headings(): array
            {
                return $this->headers;
            }

            public function columnFormats(): array
            {
                // Dates in F, M, V (dd-MMM-yyyy)
                return [
                    'F' => 'dd-mmm-yyyy',
                    'M' => 'dd-mmm-yyyy',
                    'V' => 'dd-mmm-yyyy',
                ];
            }

            public function registerEvents(): array
            {
                return [
                    \Maatwebsite\Excel\Events\AfterSheet::class => function (\Maatwebsite\Excel\Events\AfterSheet $event) {
                        $sheet = $event->sheet->getDelegate();

                        // Header style (A1:W1)
                        $headerRange = 'A1:W1';
                        $sheet->getStyle($headerRange)->getFont()->setBold(true);
                        $sheet->getStyle($headerRange)->getAlignment()
                            ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER)
                            ->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER)
                            ->setWrapText(true);
                        $sheet->getRowDimension(1)->setRowHeight(28);
                        $sheet->getStyle($headerRange)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                            ->getStartColor()->setARGB('FFE2E8F0'); // light slate
    
                        // Freeze top row and enable autofilter
                        $sheet->freezePane('A2');
                        $lastRow = $sheet->getHighestRow();
                        $sheet->setAutoFilter("A1:W{$lastRow}");

                        // Optional: tweak a few column widths for readability
                        $sheet->getColumnDimension('O')->setWidth(40); // Medical Conditions
                        $sheet->getColumnDimension('P')->setWidth(30); // Remarks
                        $sheet->getColumnDimension('B')->setWidth(24); // Emp Name
                        $sheet->getColumnDimension('J')->setWidth(24); // Dep Name
                    },
                ];
            }
        };

        // Write to /public (same as success)
        $binary = Excel::raw($export, ExcelFormat::XLSX);
        file_put_contents($absPath, $binary);

        Log::info('Excel (failed) written to public with formatting', ['path' => $absPath]);

        return [$relative, $filename];
    }

    /**
     * Send the failure email (single message with proper CC/BCC).
     */
    private function sendFailedMail(
        ?Booking $booking,
        array $recipient,
        string $companyName,
        string $officeName,
        int $totalApplicants,
        string $submissionDate,
        string $errorMessage,
        ?string $attachmentRelativePath = null,
        ?string $attachmentFilename = null
    ): void {
        try {
            /** @var \App\Settings\CommunicationSettings $commSettings */
            $commSettings = app(\App\Settings\CommunicationSettings::class);

            // Build the mailable (no recipients set here)
            $mailable = new \App\Mail\BookingFailed(
                $booking,
                $recipient,
                $companyName,
                $officeName,
                $totalApplicants,
                $submissionDate,
                $errorMessage,
                $attachmentRelativePath,
                $attachmentFilename
            );

            // To: user email or fallback so CC/BCC still deliver
            $mainTo = $recipient['email']
                ?? ($commSettings->support_email ?? config('mail.from.address'));

            // CC/BCC (accepts CSV / JSON array / array)
            $ccList = $this->parseEmailList($commSettings->email_cc_address ?? null);
            $bccList = $this->parseEmailList($commSettings->email_bcc_address ?? null);

            Mail::to($mainTo)
                ->cc($ccList)
                ->bcc($bccList)
                ->send($mailable);

            Log::info('BookingFailed mail sent', [
                'to' => $mainTo,
                'cc' => $ccList,
                'bcc' => $bccList,
                'file' => $attachmentRelativePath,
            ]);
        } catch (\Throwable $me) {
            Log::error('BookingFailed mail sending failed', [
                'mail_error' => $me->getMessage(),
            ]);
        }
    }

    /**
     * Turn string/array of emails into array
     */
    private function parseEmailList($raw): array
    {
        if (empty($raw)) {
            return [];
        }
        $candidates = is_array($raw)
            ? $raw
            : (function ($s) {
                $s = trim((string) $s);
                $json = (str_starts_with($s, '[') && str_ends_with($s, ']'))
                    ? json_decode($s, true)
                    : null;

                return is_array($json) ? $json : preg_split('/[,\n;]+/', $s);
            })($raw);
        $candidates = array_map('trim', $candidates);
        $candidates = array_filter($candidates, fn($e) => filter_var($e, FILTER_VALIDATE_EMAIL));

        return array_values(array_unique($candidates));
    }

    /**
     * New Helper for Employee–Office Mapping
     */
    private function assignEmployeeToOffice(Emp $emp, int $officeId): void
    {
        $existing = DB::table('timd_hpbms_emps_offices')
            ->where('emp_id', $emp->id)
            ->whereNull('deleted_on')
            ->orderByDesc('id')
            ->first();

        if ($existing && $existing->office_id == $officeId && $existing->status === 'active') {
            // Already active in same office → nothing to do
            return;
        }

        // Mark previous as inactive
        if ($existing && $existing->status === 'active') {
            DB::table('timd_hpbms_emps_offices')
                ->where('id', $existing->id)
                ->update([
                    'status' => 'inactive',
                    'updated_by' => auth()->id(),
                    'updated_on' => now(),
                ]);
        }

        // Insert new active relation
        DB::table('timd_hpbms_emps_offices')->insert([
            'emp_id' => $emp->id,
            'office_id' => $officeId,
            'assigned_on' => now(),
            'status' => 'active',
            'created_by' => auth()->id(),
            'created_on' => now(),
        ]);
    }

    /**
     * Display a listing of the applicant reports.
     */
    public function reportList(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated user',
            ], 401);
        }

        $userId = $user->id;

        /* ============================
         | PRELOAD MASTER DATA
         ============================ */
        $tests = Test::select('id', 'test_name', 'test_category_id')
            ->get()
            ->keyBy('id');

        $categories = TestCategory::select('id', 'name')
            ->get()
            ->keyBy('id');

        /* ============================
         | BASE QUERY
         ============================ */
        $query = BookingDetail::with([
            'booking.company',
            'booking.office',
            'employee',
            'dependent',
            'media', // ⚠️ only for BILL (Spatie)
        ])
            ->where('status', 'attended')
            ->whereHas('booking', function ($q) use ($userId) {
                $q->where('created_by', $userId);
            });

        /* ============================
         | FILTERS
         ============================ */
        if ($request->filled('uarn')) {
            $query->where('uarn', 'like', "%{$request->uarn}%");
        }

        if ($request->filled('search')) {
            $search = trim($request->search);

            $query->where(function ($q) use ($search) {
                $q->where('uarn', 'like', "%{$search}%")
                    ->orWhere('brn', 'like', "%{$search}%")
                    ->orWhere('full_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhereHas(
                        'booking.company',
                        fn($c) =>
                        $c->where('name', 'like', "%{$search}%")
                    )
                    ->orWhereHas(
                        'booking.office',
                        fn($o) =>
                        $o->where('office_name', 'like', "%{$search}%")
                    );
            });
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('report_uploaded_on', [
                Carbon::parse($request->start_date)->startOfDay(),
                Carbon::parse($request->end_date)->endOfDay(),
            ]);
        }

        if ($request->filled('company_id')) {
            $query->whereHas(
                'booking.company',
                fn($q) =>
                $q->where('id', $request->company_id)
            );
        }

        if ($request->filled('office_id') && $request->office_id !== 'all') {
            $query->whereHas(
                'booking.office',
                fn($q) =>
                $q->where('id', (int) $request->office_id)
            );
        }

        /* ============================
         | PAGINATION
         ============================ */
        $paginated = $query->orderByDesc('id')->paginate(10);

        /* ============================
         | TRANSFORM DATA
         ============================ */
        $details = $paginated->getCollection()->map(function ($item) use ($tests, $categories) {

            /* ---------- FETCH REPORT IDS ---------- */
            $reportIds = [];

            if (!empty($item->report_media_json)) {
                $reportIds = array_filter(
                    array_map('intval', explode(',', $item->report_media_json))
                );
            }

            /* ---------- FETCH REPORT ITEMS ---------- */
            $reportItems = collect();

            if (!empty($reportIds)) {
                $reportItems = DB::table('timd_booking_report_items')
                    ->whereIn('id', $reportIds)
                    ->orderBy('id')
                    ->get();
            }

            /* ---------- BUILD REPORT RESPONSE ---------- */
            $reports = $reportItems->map(function ($row) use ($tests, $categories) {

                $test = $tests->get($row->test_id);
                $category = $test
                    ? $categories->get($test->test_category_id)
                    : $categories->get($row->category_id);

                return [
                    'id' => $row->id,

                    // 📁 File info
                    'file_name' => $row->file_name,
                    'file_path' => $row->file_path,
                    'url' => asset($row->file_path),
                    'mime_type' => $row->mime_type,
                    'size' => $row->file_size,

                    // 🧪 Test & Category
                    'category_id' => $row->category_id,
                    'category_name' => $category?->name,

                    'test_id' => $row->test_id,
                    'test_name' => $test?->test_name,

                    // 📝 Notes
                    'notes' => $row->notes,

                    // ⏱ Meta
                    'uploaded_on' => $row->created_at,
                ];
            });

            /* ---------- BILL (SPATIE – UNCHANGED) ---------- */
            $bill = $item->getFirstMedia('bills');

            return [
                'id' => $item->id,
                'booking_id' => $item->booking_id,
                'brn' => $item->brn,
                'uarn' => $item->uarn,
                'full_name' => $item->full_name,
                'email' => $item->email,
                'phone' => $item->phone,
                'status' => $item->status,
                'report_status' => $item->report_status,
                'report_uploaded_on' => $item->report_uploaded_on,

                // 🏢 COMPANY / OFFICE (MASTER DATA)
                'company_name' => $item->booking?->company?->name,
                'office_name' => $item->booking?->office?->office_name,

                // ✅ REPORTS (NEW SYSTEM)
                'reports' => $reports,

                // ✅ BILL (OLD SYSTEM)
                'bill_media' => $bill ? [
                    'id' => $bill->id,
                    'file_name' => $bill->file_name,
                    'mime_type' => $bill->mime_type,
                    'size' => $bill->size,
                    'url' => $bill->getFullUrl(),
                ] : null,
            ];
        });

        /* ============================
         | FINAL RESPONSE
         ============================ */
        return response()->json([
            'success' => true,
            'message' => 'Applicant reports fetched successfully',
            'current_page' => $paginated->currentPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
            'last_page' => $paginated->lastPage(),
            'data' => $details,
        ]);
    }



    /**
     * =======================================================
     *  ⭐ NEW METHOD → DOWNLOAD REPORT OR BILL WITH TIMESTAMP
     * =======================================================
     */
    public function downloadMedia($id, $type)
    {
        $detail = BookingDetail::findOrFail($id);

        // Get correct media
        $media = null;
        if ($type === 'report') {
            $media = $detail->getFirstMedia('reports');
        } elseif ($type === 'bill') {
            $media = $detail->getFirstMedia('bills');
        }

        if (!$media) {
            abort(404, 'File not found.');
        }

        // ----------------------------------------------------------
        // ⭐ FETCH COMPANY SHORT NAME
        // ----------------------------------------------------------
        $companyShort = $detail->booking?->company?->short_name;

        if (!$companyShort) {
            $companyShort = "KORPH"; // fallback
        }

        // Clean: remove spaces + make uppercase
        $companyShort = strtoupper(str_replace(' ', '', $companyShort));

        // ----------------------------------------------------------
        // ⭐ UARN (must exist)
        // ----------------------------------------------------------
        $uarn = $detail->uarn ?? $detail->id;

        // ----------------------------------------------------------
        // ⭐ File Type (REPORT / BILL)
        // ----------------------------------------------------------
        $fileType = strtoupper($type);

        // ----------------------------------------------------------
        // ⭐ Timestamp
        // ----------------------------------------------------------
        $timestamp = now()->format('YmdHis');

        // ----------------------------------------------------------
        // ⭐ File Extension
        // ----------------------------------------------------------
        $ext = pathinfo($media->file_name, PATHINFO_EXTENSION);

        // ----------------------------------------------------------
        // ⭐ FINAL FILENAME FORMAT
        // ----------------------------------------------------------
        // {company_short}_{uarn}_{type}_{timestamp}.{ext}
        $downloadName = "{$companyShort}_{$uarn}_{$fileType}_{$timestamp}.{$ext}";

        return response()->streamDownload(function () use ($media) {
            echo file_get_contents($media->getPath());
        }, $downloadName);
    }
}
