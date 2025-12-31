<?php

namespace App\Http\Controllers\Frontend;

use App\Exports\BookingExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\StoreBookingRequest;
use App\Mail\BookingSuccessful;
use App\Mail\BookingFailed;
use App\Models\Booking;
use App\Models\BookingDetail;
use App\Models\Company;
use App\Models\CompanyOffice;
use App\Models\CompanyUser;
use App\Models\Emp;
use App\Models\EmpDependent;
use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Settings\AppSettings;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Excel as ExcelFormat;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Concerns\FromArray;
use Throwable;
use App\Notifications\BookingSubmitNotification;
use App\Notifications\BookingSuccessfulNotification;
use App\Notifications\BookingFailedNotification; // <-- ADDED
use Illuminate\Support\Facades\Notification;

class BookingController extends Controller
{
    /**
     * GET /bookings
     * Filters: company_id, office_id, booking_status, date_from, date_to, q (BRN).
     */
    public function index(Request $request)
    {
        $q = Booking::query()
            ->with([
                'company:id,name',
                'office:id,company_id,office_name,city,state',
                'requestedBy:id,name,email',
            ])
            ->when($request->company_id, fn($x) => $x->where('company_id', $request->company_id))
            ->when($request->office_id, fn($x) => $x->where('office_id', $request->office_id))
            ->when($request->booking_status, fn($x) => $x->where('booking_status', $request->booking_status))
            ->when($request->q, fn($x) => $x->where('brn', 'like', "%{$request->q}%"))
            ->when($request->date_from, fn($x) => $x->whereDate('pref_appointment_date', '>=', $request->date_from))
            ->when($request->date_to, fn($x) => $x->whereDate('pref_appointment_date', '<=', $request->date_to))
            ->orderByDesc('created_on');

        return response()->json([
            'success' => true,
            'data' => $q->paginate($request->get('per_page', 15)),
        ]);
    }

    /**
     * POST /bookings/store
     * Payload matches your example: employees[] with nested dependents[].
     * Returns the exact response structure you requested.
     */
    public function store(StoreBookingRequest $request)
    {
        Log::info('Booking store started', ['user_id' => auth()->id()]);

        $validated = $request->validated();
        Log::info('Validated request data', $validated);

        // Common context for emails/notifications
        $currentUser = auth()->user();
        $recipient = [
            'name'                  => $currentUser->name ?? 'User',
            'role'                  => $currentUser->role ?? 'User',
            'email'                 => $currentUser->email ?? null,
            'phone'                 => $currentUser->phone ?? null,
            'session_id'            => $validated['session_id'] ?? null,
            'pref_appointment_date' => $validated['pref_appointment_date'] ?? null,
        ];
        $submissionDate = now()->format('d M Y, h:i A');
        Log::info('Prepared recipient and submissionDate', compact('recipient', 'submissionDate'));

        // Attempted totals (used for failed path too)
        [$attemptEmp, $attemptDep, $attemptTotal] = $this->countAttemptedApplicants($validated);
        Log::info('Counted attempted applicants', [
            'employees'  => $attemptEmp,
            'dependents' => $attemptDep,
            'total'      => $attemptTotal,
        ]);

        // Company/Office names for context
        $companyName = optional(Company::find($validated['company_id'] ?? null))->name ?? '';
        $officeNameOnlyById = optional(CompanyOffice::find($validated['office_id'] ?? null))->office_name ?? '';
        Log::info('Fetched company/office names', ['company' => $companyName, 'office' => $officeNameOnlyById]);

        // Guard: office must belong to company
        $office = CompanyOffice::where('id', $validated['office_id'] ?? null)
            ->where('company_id', $validated['company_id'] ?? null)
            ->first();

        if (!$office) {
            Log::warning('Office validation failed', [
                'office_id'  => $validated['office_id'] ?? null,
                'company_id' => $validated['company_id'] ?? null,
            ]);

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

                $ccList  = BookingFailedNotification::parseEmailList($commSettings->email_cc_address  ?? null);
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

                Log::info('Booking failed notification sent (office mismatch)', [
                    'to'  => $mainTo,
                    'cc' => $ccList,
                    'bcc' => $bccList,
                    'file' => $failedRel
                ]);
            } catch (\Throwable $eNoti) {
                Log::error('Failed to send BookingFailed notification (office mismatch)', [
                    'error' => $eNoti->getMessage()
                ]);
            }

            return response()->json([
                'success'        => false,
                'status'         => 'error',
                'message'        => 'Office does not belong to the selected company.',
                'excel_download' => $failedDownloadUrl,
            ], 422);
        }
        Log::info('Office validation passed', ['office' => $office->toArray()]);

        // Guard: company_user must belong to same company (if provided)
        if (!empty($validated['company_user_id'])) {
            $cu = CompanyUser::where('id', $validated['company_user_id'])
                ->where('company_id', $validated['company_id'])->first();

            if (!$cu) {
                Log::warning('Company user validation failed', [
                    'company_user_id' => $validated['company_user_id'],
                    'company_id'      => $validated['company_id'],
                ]);

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

                    $ccList  = BookingFailedNotification::parseEmailList($commSettings->email_cc_address  ?? null);
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

                    Log::info('Booking failed notification sent (company user mismatch)', [
                        'to'  => $mainTo,
                        'cc' => $ccList,
                        'bcc' => $bccList,
                        'file' => $failedRel
                    ]);
                } catch (\Throwable $eNoti) {
                    Log::error('Failed to send BookingFailed notification (company user mismatch)', [
                        'error' => $eNoti->getMessage()
                    ]);
                }

                return response()->json([
                    'success'        => false,
                    'status'         => 'error',
                    'message'        => 'Company user does not belong to the selected company.',
                    'excel_download' => $failedDownloadUrl,
                ], 422);
            }
            Log::info('Company user validation passed', ['company_user_id' => $validated['company_user_id']]);
        }

        $bookingMode = $validated['booking_mode'] ?? 'online_form';
        $prefDate    = $validated['pref_appointment_date'] ?? null;
        Log::info('Booking mode and date prepared', compact('bookingMode', 'prefDate'));

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
            $booking = DB::transaction(function () use (
                $validated,
                $prefDate,
                $bookingMode,
                &$employeesCreatedUpdated,
                &$empCount,
                &$depCount
            ) {
                Log::info('Transaction started');

                // generateRefNo(companyId, officeId)
                $refNo = $this->generateRefNo($validated['company_id'], $validated['office_id']);
                Log::info('Generated booking reference number', ['ref_no' => $refNo]);

                $booking = Booking::create([
                    'company_id'            => $validated['company_id'],
                    'office_id'             => $validated['office_id'],
                    'company_user_id'       => $validated['company_user_id'] ?? null,
                    'brn'                   => $refNo,
                    'pref_appointment_date' => $prefDate,
                    'booking_status'        => 'pending',
                    'notes'                 => $validated['notes'] ?? null,
                    'created_by'            => auth()->id(),
                ]);
                Log::info('Booking created', ['booking_id' => $booking->id]);

                // Employees + Dependents
                foreach ($validated['employees'] as $empRow) {
                    Log::info('Processing employee row', $empRow);

                    [$emp, $empStatus] = $this->upsertEmployee($booking->company_id, $empRow, $booking->id);
                    Log::info('Upserted employee', ['emp_id' => $emp->id, 'status' => $empStatus]);

                    $detailEmp = $this->detailFromEmployeeRow($empRow);
                    $detailEmp['dob']   = $this->parseDob($empRow['dob'] ?? null);
                    $detailEmp['age']   = $this->deriveAge($detailEmp['dob'], $empRow['age'] ?? null);
                    $detailEmp['medical_conditions'] = $this->toMedical($empRow['medical_conditions'] ?? $empRow['conditions'] ?? null);

                    BookingDetail::create(array_merge($detailEmp, [
                        'booking_id'     => $booking->id,
                        'emp_id'         => $emp?->id,
                        'dependent_id'   => null,
                        'applicant_type' => 'employee',
                        'status'         => 'scheduled',
                        'brn'            => $booking->brn,
                        'created_by'     => auth()->id(),
                    ]));
                    Log::info('BookingDetail created for employee', ['emp_id' => $emp->id]);

                    $empCount++;

                    $empData = [
                        'type'       => 'employee',
                        'id'         => $emp->id,
                        'name'       => $emp->name,
                        'email'      => $emp->email,
                        'phone'      => $emp->phone,
                        'status'     => $empStatus,
                        'dependents' => [],
                    ];

                    $dependents = $empRow['dependents'] ?? [];
                    foreach ($dependents as $depRow) {
                        Log::info('Processing dependent row', $depRow);

                        [$dep, $depStatus] = $this->upsertDependent($emp, $depRow, $booking->id);
                        Log::info('Upserted dependent', ['dep_id' => $dep->id, 'status' => $depStatus]);

                        $detailDep = $this->detailFromDependentRow($depRow);
                        $detailDep['dob']   = $this->parseDob($depRow['dob'] ?? null);
                        $detailDep['age']   = $this->deriveAge($detailDep['dob'], $depRow['age'] ?? null);
                        $detailDep['medical_conditions'] = $this->toMedical($depRow['medical_conditions'] ?? $depRow['conditions'] ?? null);

                        BookingDetail::create(array_merge($detailDep, [
                            'booking_id'     => $booking->id,
                            'emp_id'         => $emp?->id,
                            'dependent_id'   => $dep?->id,
                            'applicant_type' => 'dependent',
                            'status'         => 'scheduled',
                            'brn'            => $booking->brn,
                            'created_by'     => auth()->id(),
                        ]));
                        Log::info('BookingDetail created for dependent', ['dep_id' => $dep->id]);

                        $depCount++;

                        $empData['dependents'][] = [
                            'type'     => 'dependent',
                            'id'       => $dep->id,
                            'name'     => $dep->name,
                            'relation' => $dep->emp_relation,
                            'email'    => $depRow['email'] ?? null,
                            'phone'    => $depRow['phone'] ?? null,
                            'status'   => $depStatus,
                        ];
                    }

                    $employeesCreatedUpdated[] = $empData;
                }

                $booking->update([
                    'total_employees'  => $empCount,
                    'total_dependents' => $depCount,
                    'updated_by'       => auth()->id(),
                ]);
                Log::info('Booking totals updated', [
                    'empCount' => $empCount,
                    'depCount' => $depCount,
                ]);

                return $booking;
            });
            // --- /TRANSACTION ---
            Log::info('Transaction completed successfully', ['booking_id' => $booking->id]);

            // SUCCESS export — write to public/uploads/booking/success
            $ts = now()->format('YmdHis');

            // Load app settings
            /** @var \App\Settings\AppSettings $appSettings */
            $appSettings = app(\App\Settings\AppSettings::class);

            // Helper to clean values (remove underscores, trim spaces)
            $clean = function ($value) {
                return str_replace('_', '', Str::slug($value ?? '', '_'));
            };

            $appShort    = $clean($appSettings->application_short_title);
            $companyShort = $clean($appSettings->company_short_name);
            $officeSafe   = $clean($office->office_name ?? $officeNameOnlyById);
            $statusSafe   = $clean($booking->booking_status);
            $brnSafe      = $clean($booking->brn);

            // Final filename format
            $excelFilename = "{$appShort}_{$companyShort}_{$officeSafe}_{$statusSafe}_{$brnSafe}_{$ts}.xls";

            $successRel    = "uploads/booking/success/{$excelFilename}";
            $successAbsDir = public_path('uploads/booking/success');
            $successAbs    = public_path($successRel);
            if (!is_dir($successAbsDir)) {
                @mkdir($successAbsDir, 0777, true);
            }

            // Save Excel in XLS format
            $export = new BookingExport($booking, $employeesCreatedUpdated);
            $binary = Excel::raw($export, \Maatwebsite\Excel\Excel::XLS);
            file_put_contents($successAbs, $binary);

            Log::info('Excel (success) written to public', ['path' => $successAbs]);


            $excelDownloadUrl = url($successRel);

            // ===== SUCCESS NOTIFICATION (SYNC) =====
            try {
                /** @var \App\Settings\CommunicationSettings $commSettings */
                $commSettings = app(\App\Settings\CommunicationSettings::class);

                $totalApplicants = $empCount + $depCount;

                // Primary recipient; fallback to support/from address so CC/BCC still deliver
                $mainTo = $currentUser->email ?: ($commSettings->support_email ?? config('mail.from.address'));

                // CC/BCC from CommunicationSettings (CSV/JSON/array supported)
                $ccList  = $this->parseEmailList($commSettings->email_cc_address  ?? null);
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
                        $totalApplicants,
                        $submissionDate,
                        $successRel,   // relative to /public
                        $excelFilename,
                        $ccList,
                        $bccList
                    ))->onConnection('sync') // <--- FORCE SYNC
                );

                Log::info('Booking success notification sent', [
                    'to'  => $mainTo,
                    'cc'  => $ccList,
                    'bcc' => $bccList,
                ]);
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
                'status'  => 'success',
                'data'    => [
                    'booking_id'       => $booking->id,
                    'ref_no'           => $booking->brn,
                    'request_date'     => $booking->pref_appointment_date,
                    'booking_mode'     => $bookingMode,
                    'user_id'          => auth()->id(),
                    'company_id'       => $booking->company_id,
                    'office_id'        => $booking->office_id,
                    'submitted_by'     => $user,
                    'booking_status'   => $booking->booking_status,
                    'total_applicants' => $empCount + $depCount,
                    'applicants'       => $employeesCreatedUpdated,
                    'excel_download'   => $excelDownloadUrl,
                    'integrations'     => [
                        'crm'          => 'success',
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

            // Send FAILED notification (SYNC)
            try {
                /** @var \App\Settings\CommunicationSettings $commSettings */
                $commSettings = app(\App\Settings\CommunicationSettings::class);

                $mainTo = $recipient['email']
                    ?? ($commSettings->support_email ?? config('mail.from.address'));

                $ccList  = BookingFailedNotification::parseEmailList($commSettings->email_cc_address  ?? null);
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

                Log::info('Booking failed notification sent (exception path)', [
                    'to'  => $mainTo,
                    'cc' => $ccList,
                    'bcc' => $bccList,
                    'file' => $failedRel
                ]);
            } catch (\Throwable $eNoti) {
                Log::error('Failed to send BookingFailed notification (exception path)', [
                    'error' => $eNoti->getMessage()
                ]);
            }

            return response()->json([
                'success'        => false,
                'status'         => 'error',
                'data'           => $e->getMessage() ?: 'Unknown error occurred.',
                'message'        => 'Something went wrong while creating the booking.',
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
            'details.employee:id,company_id,name,email,phone,gender,dob,age,designation',
            'details.dependent:id,emp_id,emp_relation,name,gender,age',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $booking,
        ]);
    }

    /**
     * PATCH /bookings/{id}/status
     * { "booking_status": "confirmed" | "cancelled" | "completed" }
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'booking_status' => ['required', 'in:pending,confirmed,cancelled,completed']
        ]);

        $booking = Booking::findOrFail($id);

        $from = $booking->booking_status;
        $to   = $request->booking_status;

        $allowed = [
            'pending'   => ['confirmed', 'cancelled'],
            'confirmed' => ['completed', 'cancelled'],
            'cancelled' => [],
            'completed' => [],
        ];

        if (!in_array($to, $allowed[$from] ?? [], true)) {
            return response()->json([
                'success' => false,
                'status'  => 'error',
                'message' => "Invalid status transition: {$from} → {$to}",
            ], 422);
        }

        $booking->update([
            'booking_status' => $to,
            'updated_by'     => auth()->id(),
        ]);

        if ($to === 'cancelled') {
            BookingDetail::where('booking_id', $booking->id)
                ->where('status', 'scheduled')
                ->update(['status' => 'cancelled', 'updated_by' => auth()->id()]);
        }

        return response()->json([
            'success' => true,
            'status'  => 'success',
            'message' => "Booking status updated to {$to}.",
            'data'    => $booking->fresh('details'),
        ]);
    }

    // =========================================================
    // Helpers
    // =========================================================

    private function generateRefNo_old(int $companyId, int $officeId, int $createdBy): string
    {
        $short = $this->getCompanyShort($companyId);
        $yymm  = now(config('app.timezone', 'Asia/Kolkata'))
            ->subMonth()
            ->format('ym');

        $prefix = "{$short}{$companyId}{$officeId}{$yymm}";

        $last = Booking::where('company_id', $companyId)
            ->where('office_id',  $officeId)
            ->where('created_by', $createdBy)
            ->where('brn', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderByDesc('brn')
            ->value('brn');

        $nextSeq = $last ? ((int)substr($last, -4)) + 1 : 1;

        return $prefix . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);
    }

    private function generateRefNo($companyId, $officeId)
    {
        // Get company code
        $companyCode = $this->getCompanyShort($companyId);
        Log::info('Company code for booking ref', [
            'company_id' => $companyId,
            'office_id'  => $officeId,
            'code'       => $companyCode
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
        if (!$g) return null;
        $g = strtolower(trim($g));
        return in_array($g, ['male', 'female', 'other'], true) ? $g : null;
    }

    private function joinMedical(?array $conditions): ?string
    {
        if (!$conditions || !is_array($conditions)) return null;
        $clean = array_values(array_unique(array_map(fn($s) => trim((string)$s), $conditions)));
        return $clean ? implode(', ', $clean) : null;
    }

    private function parseDob(?string $dob): ?Carbon
    {
        return $dob ? Carbon::parse($dob) : null;
    }

    private function deriveAge(?Carbon $dob, ?int $providedAge = null): ?int
    {
        if ($providedAge !== null) return $providedAge;
        return $dob ? $dob->age : null;
    }

    /**
     * Upsert Employee by (email or phone) within company.
     * Returns [Emp, 'new_created'|'existing_updated'].
     */
    private function upsertEmployee(int $companyId, array $row, int $bookingId): array
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
            'company_id'         => $companyId,
            'name'               => $row['name'],
            'email'              => $email,
            'phone'              => $phone,
            'gender'             => $this->normalizeGender($row['gender'] ?? null),
            'dob'                => $dob,
            'age'                => $age,
            'designation'        => $row['designation'] ?? null,
            'medical_conditions' => $row['medical_conditions'] ?? null,
            'remarks'            => $row['remarks'] ?? null,
            'status'             => 'active',
            'booking_id'         => $bookingId,
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
    private function upsertDependent(Emp $emp, array $row, int $bookingId): array
    {
        $relation = $row['emp_relation'] ?? ($row['relation'] ?? 'other');
        $name = $row['name'] ?? '';

        $existing = EmpDependent::where('emp_id', $emp->id)
            ->where('name', $name)
            ->where('emp_relation', $relation)
            ->first();

        $payload = [
            'emp_id'       => $emp->id,
            'emp_relation' => $relation,
            'name'         => $name,
            'gender'       => $this->normalizeGender($row['gender'] ?? null),
            'age'          => $row['age'] ?? null,
            'medical_conditions' => $row['medical_conditions'] ?? null,
            'remarks'      => $row['remarks'] ?? null,
            'status'       => 'active',
            'booking_id'   => $bookingId,
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
        $age = $this->deriveAge($dob, $row['age'] ?? null);

        return [
            'full_name'          => $row['name'],
            'gender'             => $this->normalizeGender($row['gender'] ?? null),
            'dob'                => $dob,
            'age'                => $age,
            'email'              => $row['email'] ?? null,
            'phone'              => $row['phone'] ?? null,
            'designation'        => $row['designation'] ?? null,
            'emp_relation'       => null,
            'medical_conditions' => $row['medical_conditions'] ?? null,
            'remarks'            => $row['remarks'] ?? null,
        ];
    }

    private function detailFromDependentRow(array $row): array
    {
        $dob = $this->parseDob($row['dob'] ?? null);
        $age = $this->deriveAge($dob, $row['age'] ?? null);

        return [
            'full_name'          => $row['name'],
            'gender'             => $this->normalizeGender($row['gender'] ?? null),
            'dob'                => $dob,
            'age'                => $age,
            'email'              => $row['email'] ?? null,
            'phone'              => $row['phone'] ?? null,
            'designation'        => null,
            'emp_relation'       => $row['emp_relation'] ?? ($row['relation'] ?? 'other'),
            'medical_conditions' => $row['medical_conditions'] ?? null,
            'remarks'            => $row['remarks'] ?? null,
        ];
    }

    private function toMedical(?array $val): ?string
    {
        if (!$val || !is_array($val)) return null;
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
            if (is_array($val)) return implode(', ', array_filter(array_map('trim', $val), fn($v) => $v !== ''));
            return $val ? trim((string)$val) : null;
        };

        // helper: convert date string -> Excel serial (so formatting applies)
        $toExcelDate = function ($dateStr) {
            if (empty($dateStr)) return null;
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
            $empAge      = $emp['age'] ?? null;
            $empMed      = $joinMed($emp['medical_conditions'] ?? ($emp['conditions'] ?? null));

            // Employee row (no dependent)
            $rows[] = [
                'employee',
                $emp['name']  ?? null,
                $emp['email'] ?? null,
                $emp['phone'] ?? null,
                $emp['gender'] ?? null,
                $empDobExcel,             // F date
                is_numeric($empAge) ? (int)$empAge : null, // G number
                $emp['designation'] ?? null,
                null,
                null,
                null,
                null,
                null,
                null,
                $empMed,                  // O
                $emp['remarks'] ?? null,  // P
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
                $depAge      = $dep['age'] ?? null;
                $depMed      = $joinMed($dep['medical_conditions'] ?? ($dep['conditions'] ?? null));

                $rows[] = [
                    'dependent',
                    $emp['name']  ?? null,
                    $emp['email'] ?? null,
                    $emp['phone'] ?? null,
                    null,
                    $empDobExcel,                 // M date
                    is_numeric($empAge) ? (int)$empAge : null, // N number
                    $emp['designation'] ?? null,  // H
                    $dep['relation'] ?? ($dep['emp_relation'] ?? null), // I
                    $dep['name'] ?? null,         // J
                    $dep['email'] ?? null,        // K
                    $dep['phone'] ?? null,        // L
                    $depDobExcel,                 // M date
                    is_numeric($depAge) ? (int)$depAge : null, // N number
                    $depMed,                      // O
                    $dep['remarks'] ?? null,      // P
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
            if (!$value) return null;
            return str_replace('_', '', \Illuminate\Support\Str::slug($value, '_'));
        };

        $appShort    = $clean($appSettings->application_short_title);
        $companyShort = $clean($appSettings->company_short_name);
        $officeSafe   = $clean($officeName);
        $statusSafe   = 'failed'; // fixed status for this export
        $brnSafe      = $clean($validated['brn'] ?? $validated['session_id'] ?? null); // optional BRN/SID

        // Collect parts, remove null/empty
        $parts = array_filter([$appShort, $companyShort, $officeSafe, $statusSafe, $brnSafe, $ts]);

        // Join with underscores
        $filename = implode('_', $parts) . '.xls';

        // Paths
        $relative = "uploads/booking/failed/{$filename}";
        $absDir   = public_path('uploads/booking/failed');
        $absPath  = public_path($relative);
        if (!is_dir($absDir)) {
            @mkdir($absDir, 0777, true);
        }


        // Build export with headings + styles
        $export = new class($rows, $headers) implements
            \Maatwebsite\Excel\Concerns\FromArray,
            \Maatwebsite\Excel\Concerns\WithHeadings,
            \Maatwebsite\Excel\Concerns\ShouldAutoSize,
            \Maatwebsite\Excel\Concerns\WithColumnFormatting,
            \Maatwebsite\Excel\Concerns\WithEvents
        {
            private array $rows;
            private array $headers;

            public function __construct(array $rows, array $headers)
            {
                $this->rows    = $rows;
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
            $ccList  = $this->parseEmailList($commSettings->email_cc_address  ?? null);
            $bccList = $this->parseEmailList($commSettings->email_bcc_address ?? null);

            Mail::to($mainTo)
                ->cc($ccList)
                ->bcc($bccList)
                ->send($mailable);

            Log::info('BookingFailed mail sent', [
                'to'   => $mainTo,
                'cc'   => $ccList,
                'bcc'  => $bccList,
                'file' => $attachmentRelativePath,
            ]);
        } catch (\Throwable $me) {
            Log::error('BookingFailed mail sending failed', [
                'mail_error' => $me->getMessage()
            ]);
        }
    }

    /**
     * Turn string/array of emails into array
     */
    private function parseEmailList($raw): array
    {
        if (empty($raw)) return [];
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
}
