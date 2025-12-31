<?php

namespace App\Http\Controllers;

use App\Enum\BookingApplicantStatus;
use App\Enum\BookingStatus;
use App\Mail\ShareReportMail;
use App\Models\Booking;
use App\Models\BookingDetail;
use App\Models\Company;
use App\Models\CompanyOffice;
use App\Notifications\BillUploadedSuccessNotification;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Yajra\DataTables\DataTables;

class BookingAdminController extends Controller
{
    protected function baseQuery(Request $request)
    {
        // Normalize incoming status for case-insensitive match
        $status = strtolower(trim((string) $request->booking_status));

        return Booking::query()
            ->with([
                'company:id,name',
                'office:id,company_id,office_name,city,state',
                'requestedBy:id,name,email',
            ])
            ->when($request->company_id, fn($q) => $q->where('company_id', $request->company_id))
            ->when($request->office_id, fn($q) => $q->where('office_id', $request->office_id))
            // important: ignore "all" and empty, match status in lowercase
            ->when(
                $status && $status !== 'all',
                fn($q) => $q->whereRaw('LOWER(booking_status) = ?', [$status])
            )
            ->when($request->q, fn($q) => $q->where('brn', 'like', "%{$request->q}%"))
            ->when($request->start_date, fn($q) => $q->whereDate('pref_appointment_date', '>=', $request->start_date))
            ->when($request->end_date, fn($q) => $q->whereDate('pref_appointment_date', '<=', $request->end_date))

            ->orderByDesc('created_on');
    }

    public function index(Request $request)
    {
        return Inertia::render('Bookings/Index', [
            'title' => 'Bookings',
            'filters' => [
                'company_id' => $request->company_id,
                'office_id' => $request->office_id,
                'booking_status' => $request->booking_status,
                'q' => $request->q,
                'date_from' => $request->date_from,
                'date_to' => $request->date_to,
            ],
            'statusOptions' => ['pending', 'confirmed', 'cancelled', 'completed'],
        ]);
    }

    public function list(Request $request)
    {
        $query = $this->baseQuery($request)->select([
            'id',
            'company_id',
            'office_id',
            'brn',
            'pref_appointment_date',
            'notes',
            'booking_status',
            'total_employees',
            'total_dependents',
            'preferred_collection_mode',
            'created_on',

            // ⭐ REQUIRED FIELD
            'is_hold',
        ]);

        return DataTables::of($query)
            ->addIndexColumn()
            ->editColumn(
                'pref_appointment_date',
                fn($r) => $r->pref_appointment_date
                ? $r->pref_appointment_date->format('Y-m-d')
                : null
            )
            ->editColumn('created_on', fn($r) => optional($r->created_on))
            ->addColumn('company', fn($r) => $r->company?->name)
            ->addColumn('office', fn($r) => $r->office?->office_name)
            ->addColumn('total_applicants', fn($r) => (int) $r->total_employees + (int) $r->total_dependents)

            ->addColumn('preferred_collection_mode', function ($row) {
                if (!$row->preferred_collection_mode) {
                    return '-';
                }

                $modes = explode(',', $row->preferred_collection_mode);

                $labels = array_map(function ($mode) {
                    return match (trim($mode)) {
                        'at_home' => 'At-Home',
                        'at_clinic' => 'At-Clinic',
                        default => ucfirst(str_replace('_', ' ', $mode)),
                    };
                }, $modes);

                return implode(', ', $labels);
            })

            ->addColumn('action', function ($r) {
                return [
                    'id' => $r->id,
                    'view_url' => route('booking.show', $r->id),
                    'edit_url' => route('booking.edit', $r->id),
                    'status_url' => route('booking.status', $r->id),
                    'delete_url' => route('booking.destroy', $r->id),
                    'export_url' => route('booking.export', $r->id),
                    'report_url' => route('booking.report', $r->id),

                    // ⭐ VERY IMPORTANT: SEND is_hold HERE TOO
                    'is_hold' => $r->is_hold,
                ];
            })

            // ⭐ ALSO include is_hold in each row root-level
            ->addColumn('is_hold', fn($r) => (int) $r->is_hold)

            ->toJson();
    }

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

        // \Log::info('Booking show response', $booking->toArray());
        return response()->json(['success' => true, 'data' => $booking]);
    }

    // Edit page for status update

    public function edit($id)
    {
        $booking = Booking::with([
            'company:id,name',
            'office:id,office_name',
            'details' => fn($q) => $q->orderBy('id'),
            'details.employee:id,name,email,phone,gender,dob,age,designation',
            'details.dependent:id,emp_id,emp_relation,name,gender,age',
            'requestedBy:id,name,email,phone',
            'createdBy:id,name,email,phone',
            'media', // 👈 If using Media Library for bills
        ])
            ->select([
                'id',
                'brn',
                'booking_status',
                'notes',
                'pref_appointment_date',
                'company_id',
                'office_id',
                'total_employees',
                'total_dependents',
                'created_on',
                'created_by',
                'company_user_id',
                'status_remarks',
                'bill_media_notes', // ✅
                'is_hold',
            ])
            ->findOrFail($id);

        // ✅ Use correct collection name
        $billMedia = $booking->getFirstMedia('bills');

        $booking->bill_media_url = $billMedia ? $billMedia->getUrl() : null;
        $booking->bill_media_name = $billMedia ? $billMedia->file_name : null;

        // dd($billMedia, $booking->toArray());

        $statusOptions = collect(BookingStatus::cases())
            ->map(fn($status) => [
                'value' => $status->value,
                'label' => $status->label(),
            ])
            ->values();

        return Inertia::render('Bookings/Edit', [
            'title' => 'Edit Booking',
            'booking' => $booking,
            'statusOptions' => $statusOptions,
        ]);
    }

    public function applicantsList(Request $request, $brn)
    {
        $searchValue = $request->input('search.value'); // read the same key you send

        $query = BookingDetail::query()
            ->with([
                'booking:id,brn,company_id,office_id',
                'booking.company:id,name',
                'booking.office:id,office_name',
                'reportItems', // 👈 REQUIRED
            ])
            ->where('brn', $brn);

        // ✅ Add manual search filter
        if (!empty($searchValue)) {
            $query->where(function ($q) use ($searchValue) {
                $q->where('full_name', 'like', "%{$searchValue}%")
                    ->orWhere('uarn', 'like', "%{$searchValue}%")
                    ->orWhere('status', 'like', "%{$searchValue}%")
                    ->orWhereHas('booking.company', function ($qc) use ($searchValue) {
                        $qc->where('name', 'like', "%{$searchValue}%");
                    })
                    ->orWhereHas('booking.office', function ($qo) use ($searchValue) {
                        $qo->where('office_name', 'like', "%{$searchValue}%");
                    });
            });
        }

        return \Yajra\DataTables\DataTables::of($query)
            ->addIndexColumn()
            ->addColumn('company_name', fn($r) => $r->booking?->company?->name ?? '-')
            ->addColumn('office_name', fn($r) => $r->booking?->office?->office_name ?? '-')
            ->editColumn('status', fn($r) => ucfirst($r->status))
            ->addColumn('report_items', function ($row) {

                return $row->reportItems->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'category_id' => (int) $item->category_id,
                        'test_id' => (int) $item->test_id,
                        'notes' => $item->notes,
                        'media_id' => $item->media_id,
                        'file_name' => $item->file_name,
                        'file_path' => $item->file_path, // already full URL
                        'mime_type' => $item->mime_type,
                        'file_size' => $item->file_size,
                    ];
                })->values()->toArray(); // 🔥 IMPORTANT
            })
            ->toJson();
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'booking_status' => ['required', Rule::in(['pending', 'confirmed', 'cancelled', 'partially_completed', 'completed'])],
            'status_remarks' => ['nullable', 'string', 'max:1000'],
            'bill_media_notes' => 'nullable|string|max:2000',
            'bill_media' => 'nullable|file|mimes:pdf,png,jpg,jpeg|max:10240',
        ]);

        $booking = Booking::findOrFail($id);

        // 🚫 BLOCK IF BOOKING IS HOLD
        if ($booking?->is_hold == 1) {
            return response()->json([
                'success' => false,
                'message' => 'Booking is on HOLD. Status update blocked.',
            ], 403);
        }

        $from = strtolower($booking->booking_status);
        $to = strtolower($request->booking_status);

        // Allowed transitions
        $allowed = [
            'pending' => ['confirmed', 'cancelled'],
            'confirmed' => ['cancelled', 'partially_completed', 'completed'],
            'cancelled' => [],
        ];

        if ($from !== $to) {

            // Invalid current status
            if (!array_key_exists($from, $allowed)) {
                return response()->json([
                    'success' => false,
                    'message' => "Unknown current status: {$from}",
                ], 422);
            }

            // Invalid transition
            if (!in_array($to, $allowed[$from], true)) {
                return response()->json([
                    'success' => false,
                    'message' => "Invalid status transition: {$from} → {$to}",
                ], 422);
            }

            // -----------------------------------------------------
            // ✔ Update MAIN BOOKING STATUS
            // -----------------------------------------------------
            $booking->update([
                'booking_status' => $to,
                'status_remarks' => $request->status_remarks,
                'updated_by' => Auth::id(),
            ]);

            // -----------------------------------------------------
            // ✔ Sync BookingDetail statuses based on new booking status
            // -----------------------------------------------------
            // -----------------------------------------------------
            // ✔ Sync BookingDetail statuses based on new booking status
            // -----------------------------------------------------

            // SYNC BOOKING DETAILS WITH BOOKING STATUS
            if ($to === 'confirmed') {
                BookingDetail::where('booking_id', $booking->id)
                    ->update([
                        'status' => BookingApplicantStatus::SCHEDULED->value,
                        'status_updated_by' => Auth::id(),
                        'status_updated_on' => now(),
                    ]);
            }

            if ($to === 'cancelled') {
                BookingDetail::where('booking_id', $booking->id)
                    ->update([
                        'status' => BookingApplicantStatus::CANCELLED->value,
                        'status_updated_by' => Auth::id(),
                        'status_updated_on' => now(),
                    ]);
            }
        } else {
            // Status not changed → only update remarks
            $booking->update([
                'status_remarks' => $request->status_remarks,
                'updated_by' => Auth::id(),
            ]);
        }

        // -----------------------------------------------------
        // ✔ Bill Media Upload Logic
        // -----------------------------------------------------
        try {
            if ($request->hasFile('bill_media')) {
                if ($booking->hasMedia('bills')) {
                    $booking->clearMediaCollection('bills');
                }

                $file = $request->file('bill_media');

                $media = $booking
                    ->addMedia($file)
                    ->usingFileName(time() . '_' . $file->getClientOriginalName())
                    ->usingName($file->getClientOriginalName())
                    ->toMediaCollection('bills', 'uploads');

                $booking->update([
                    'bill_media_id' => $media->id,
                    'bill_media_notes' => $request->bill_media_notes,
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('Bill media upload failed', ['error' => $e->getMessage()]);
        }

        // -----------------------------------------------------
        // ✔ Notification Logic
        // -----------------------------------------------------
        try {
            $user = Auth::user();
            $message = "Booking #{$booking->brn} status changed to {$to}";

            Notification::create([
                'user_id' => $user->id,
                'customer_id' => $booking->requested_by,
                'message' => $message,
                'long_content' => sprintf(
                    'Booking #%s status updated from %s → %s',
                    $booking->brn,
                    ucfirst($from),
                    ucfirst($to)
                ),
                'date_time' => now(),
                'is_read' => 'unread',
                'notification_type' => 'booking_status',
                'source' => 'booking',
                'created_by' => $user->id,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to create booking status notification', [
                'error' => $e->getMessage(),
                'booking_id' => $booking->id ?? null,
            ]);
        }

        // -----------------------------------------------------
        // ✔ Final Response
        // -----------------------------------------------------
        return response()->json([
            'success' => true,
            'message' => 'Booking status updated successfully.',
        ]);
    }

    public function toggleHold($id, Request $request)
    {
        $active = $request->is_hold == 1 ? 1 : 0;

        $booking = Booking::with('details')->findOrFail($id);

        // Update main booking
        $booking->update(['is_hold' => $active]);

        // Update all details
        // foreach ($booking->details as $detail) {
        //     $detail->update(['is_hold' => $active]);
        // }

        return response()->json([
            'success' => true,
            'is_hold' => $active,
            'message' => $active ? 'Booking placed on HOLD' : 'Booking UN-HOLD',
        ]);
    }

    public function updateDetailsStatus(Request $request, $detailId)
    {
        try {
            $detail = BookingDetail::findOrFail($detailId);

            // -------------------------
            // VALIDATION
            // -------------------------
            $request->validate([
                'status' => ['required', 'in:scheduled,attended,cancelled,no_show'],
                'status_remarks' => ['nullable', 'string', 'max:1000'],
                'reason_code' => ['nullable', 'string', 'max:50'],
            ]);

            $newStatus = $request->status;

            // 🚫 BLOCK IF BOOKING IS HOLD
            if ($detail->booking?->is_hold == 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Booking is on HOLD. Status update blocked.',
                ], 403);
            }

            // -------------------------
            // FIXED LOGIC:
            // If attended → report_status = processing
            // Otherwise → keep old value (never NULL)
            // -------------------------
            $reportStatus = $detail->report_status;

            if ($newStatus === BookingDetail::STATUS_ATTENDED) {
                $reportStatus = BookingDetail::REPORT_PROCESSING;
            }

            // If still null → assign safe default
            if (empty($reportStatus)) {
                $reportStatus = null; // or 'processing' if you want always
            }

            // -------------------------
            // UPDATE
            // -------------------------
            $detail->update([
                'status' => $newStatus,
                'status_remarks' => $request->status_remarks,
                'status_reason_code' => $request->reason_code,
                'status_updated_by' => Auth::id(),
                'status_updated_on' => now(),
                'report_status' => $reportStatus,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Applicant status updated successfully.',
                'data' => [
                    'status' => $detail->status,
                    'status_remarks' => $detail->status_remarks,
                    'report_status' => $detail->report_status,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update applicant status.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function bulkUpdateDetailsStatus(Request $request)
    {
        try {

            // -------------------------
            // VALIDATION
            // -------------------------
            $validated = $request->validate([
                'applicant_id' => ['required', 'array', 'min:1'],
                'applicant_id.*' => ['integer', 'exists:timd_hpbms_companies_booking_details,id'],
                'status' => ['required', 'in:scheduled,attended,cancelled,no_show'],
                'status_remarks' => ['nullable', 'string', 'max:1000'],
                'reason_code' => ['nullable', 'string', 'max:50'],
            ]);

            $ids = $validated['applicant_id'];
            $newStatus = $validated['status'];
            $remarks = $validated['status_remarks'] ?? null;
            $reasonCode = $validated['reason_code'] ?? null;

            // Fetch all applicants with booking relation
            $details = BookingDetail::with('booking')
                ->whereIn('id', $ids)
                ->get();

            if ($details->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No applicants found for the given IDs.',
                ], 404);
            }

            $updatedIds = [];
            $skippedHoldIds = [];

            foreach ($details as $detail) {

                // -----------------------------------------
                // ⛔ SKIP IF BOOKING IS HOLD
                // -----------------------------------------
                if ($detail->booking?->is_hold == 1) {
                    $skippedHoldIds[] = $detail->id;

                    continue;
                }

                // ----------------------------------------------------
                // ✅ REPORT STATUS HANDLING (Only for attended)
                // ----------------------------------------------------
                $reportStatus = $detail->report_status; // keep previous

                if ($newStatus === BookingDetail::STATUS_ATTENDED) {

                    // If first time attending, set PROCESSING
                    if (empty($reportStatus)) {
                        $reportStatus = BookingDetail::REPORT_PROCESSING;
                    }
                } else {
                    // For ANY other status → reset report status
                    $reportStatus = null;
                }

                // ----------------------------------------------------
                // UPDATE RECORD
                // ----------------------------------------------------
                $detail->update([
                    'status' => $newStatus,
                    'status_remarks' => $remarks,
                    'status_reason_code' => $reasonCode,
                    'status_updated_by' => Auth::id(),
                    'status_updated_on' => now(),
                    'report_status' => $reportStatus,
                ]);

                $updatedIds[] = $detail->id;
            }

            return response()->json([
                'success' => true,
                'message' => 'Bulk applicant status update completed.',
                'data' => [
                    'updated_ids' => $updatedIds,
                    'skipped_hold_ids' => $skippedHoldIds,
                ],
            ]);
        } catch (\Throwable $e) {

            return response()->json([
                'success' => false,
                'message' => 'Failed to update applicant statuses.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // HARD delete booking + details (transaction-safe)
    public function destroy($id)
    {
        $booking = Booking::where('id', $id)->first();

        // 🚫 BLOCK IF BOOKING IS HOLD
        if ($booking?->is_hold == 1) {
            return response()->json([
                'success' => false,
                'message' => 'Booking is on HOLD. Cannot be deleted.',
            ], 403);
        }
        DB::transaction(function () use ($id) {
            BookingDetail::where('booking_id', $id)->delete();
            Booking::where('id', $id)->delete();
        });

        return response()->json(['success' => true, 'message' => 'Booking deleted successfully.']);
    }

    public function export($id)
    {
        $booking = Booking::findOrFail($id);
        $appSettings = app(\App\Settings\AppSettings::class);

        // helper to clean values into safe filename parts
        $clean = fn($value) => trim(str_replace('-', '', Str::slug($value ?? '', '_')));

        $companyName = optional(Company::find($booking->company_id))->name ?? '';
        $officeName = optional(CompanyOffice::find($booking->office_id))->office_name ?? '';

        $ts = now()->format('YmdHis');
        $appShort = $clean($appSettings->application_short_title);
        $companySafe = $clean($companyName);
        $officeSafe = $clean($officeName);
        $statusSafe = $clean($booking->booking_status);
        $brnSafe = $clean($booking->brn);

        // build filename parts, skipping empty ones
        $parts = array_filter([$appShort, $companySafe, $officeSafe, $statusSafe, $brnSafe, $ts]);
        $filename = implode('_', $parts) . '.xlsx';

        return Excel::download(new \App\Exports\BookingExport($booking), $filename);
    }

    public function exportReport($id)
    {
        $booking = Booking::findOrFail($id);
        $appSettings = app(\App\Settings\AppSettings::class);

        // helper to clean values into safe filename parts
        $clean = fn($value) => trim(str_replace('-', '', Str::slug($value ?? '', '_')));

        $companyName = optional(Company::find($booking->company_id))->name ?? '';
        $officeName = optional(CompanyOffice::find($booking->office_id))->office_name ?? '';

        $ts = now()->format('YmdHis');
        $appShort = $clean($appSettings->application_short_title);
        $companySafe = $clean($companyName);
        $officeSafe = $clean($officeName);
        $statusSafe = $clean($booking->booking_status);
        $brnSafe = $clean($booking->brn);

        // build filename parts, skipping empty ones
        $parts = array_filter([$appShort, $companySafe, $officeSafe, $statusSafe, $brnSafe, $ts]);
        $filename = implode('_', $parts) . '.xlsx';

        return Excel::download(new \App\Exports\BookingApplicantExport($booking), $filename);
    }

    // Booking Details section
    public function detailStatus(Request $request, $id)
    {
        try {
            // ---------------------------------------------------------
            // FETCH DETAIL
            // ---------------------------------------------------------
            $detail = BookingDetail::with(['booking.office', 'booking.requestedBy'])->findOrFail($id);

            // ---------------------------------------------------------
            // VALIDATION
            // ---------------------------------------------------------
            $request->validate([
                'status' => ['required', 'in:scheduled,attended,cancelled,no_show'],
                'status_remarks' => ['nullable', 'string', 'max:1000'],
                'bill_media_notes' => ['nullable', 'string', 'max:2000'],
                'bill_media' => ['nullable', 'file', 'mimes:pdf,png,jpg,jpeg', 'max:10240'],
                'send_mail' => ['nullable', 'in:yes,no'],
                'skip_office_hr' => ['nullable', 'boolean'],
            ]);

            // ---------------------------------------------------------
            // UPDATE STATUS
            // ---------------------------------------------------------
            $detail->update([
                'status' => $request->status,
                'status_remarks' => $request->status_remarks,
                'updated_by' => Auth::id(),
            ]);

            $media = null;

            // ---------------------------------------------------------
            // ENSURE UPLOADS FOLDER EXISTS + GIVE PERMISSIONS
            // ---------------------------------------------------------
            $uploadPath = public_path('uploads');

            try {
                if (!file_exists($uploadPath)) {
                    mkdir($uploadPath, 0755, true);
                    chmod($uploadPath, 0755);
                    Log::info('📁 Created uploads folder with permission 0755');
                } else {
                    chmod($uploadPath, 0755);
                    Log::info('🔧 Updated uploads folder permission to 0755');
                }
            } catch (\Throwable $permEx) {
                Log::error('❌ Failed to set uploads folder permission', [
                    'path' => $uploadPath,
                    'error' => $permEx->getMessage(),
                ]);
            }

            // ---------------------------------------------------------
            // BILL FILE UPLOAD
            // ---------------------------------------------------------
            if ($request->hasFile('bill_media')) {

                // Remove old bill
                if ($detail->hasMedia('bills')) {
                    Log::info('🗑 Removing old bill file...');
                    $detail->clearMediaCollection('bills');
                }

                $file = $request->file('bill_media');

                // Upload new bill
                $media = $detail
                    ->addMedia($file)
                    ->usingFileName(time() . '_' . $file->getClientOriginalName())
                    ->usingName($file->getClientOriginalName())
                    ->toMediaCollection('bills', 'uploads');

                $detail->update([
                    'bill_media_id' => $media->id,
                    'bill_media_notes' => $request->bill_media_notes,
                    'bill_uploaded_by' => Auth::id(),
                    'bill_uploaded_on' => now(),
                ]);
            }

            // ---------------------------------------------------------
            // BILL NOTES ONLY (NO FILE)
            // ---------------------------------------------------------
            elseif ($request->filled('bill_media_notes')) {
                $detail->update([
                    'bill_media_notes' => $request->bill_media_notes,
                ]);
            }

            // ---------------------------------------------------------
            // SEND EMAIL ONLY IF send_mail=yes
            // ---------------------------------------------------------
            if ($request->send_mail === 'yes') {

                $to = $detail->email;
                $ccList = [];

                if (!$request->boolean('skip_office_hr')) {
                    if ($detail->booking->office?->email) {
                        $ccList[] = $detail->booking->office->email;
                    }

                    if ($detail->booking->requestedBy?->email) {
                        $ccList[] = $detail->booking->requestedBy->email;
                    }
                }

                $bccList = [];

                // Try sending email
                try {
                    Notification::route('mail', $to)->notify(
                        new BillUploadedSuccessNotification($detail, $ccList, $bccList)
                    );
                } catch (\Throwable $mailEx) {
                    Log::error('❌ Bill email FAILED', [
                        'error' => $mailEx->getMessage(),
                        'trace' => $mailEx->getTraceAsString(),
                    ]);
                }
            }

            // ---------------------------------------------------------
            // FINAL RESPONSE
            // ---------------------------------------------------------
            return response()->json([
                'success' => true,
                'message' => 'Booking detail updated successfully',
                'data' => [
                    'status' => $detail->status,
                    'bill_notes' => $detail->bill_media_notes,
                    'bill_media' => $media ? [
                        'id' => $media->id,
                        'url' => $media->getFullUrl(),
                    ] : null,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Update failed.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * ✅ Upload and link report file using Spatie Media Library
     */
    public function uploadReport(Request $request, $id)
    {
        DB::beginTransaction();

        try {

            /* ---------------------------------------------
             | Load booking detail
             --------------------------------------------- */
            $detail = BookingDetail::with('booking')->findOrFail($id);

            if ($detail->booking?->is_hold) {
                return response()->json([
                    'success' => false,
                    'message' => 'Booking is on HOLD — Report upload blocked.',
                ], 403);
            }

            /* ---------------------------------------------
             | Get uploaded files
             --------------------------------------------- */
            $files = $request->file('report_items');

            if (!is_array($files)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No report files received.',
                ], 422);
            }

            $insertedIds = [];

            foreach ($files as $index => $item) {

                if (!isset($item['report_file'])) {
                    continue;
                }

                $file = $item['report_file'];

                if (!$file->isValid()) {
                    continue;
                }

                /* ---------------------------------------------
                 | Generate safe file name
                 --------------------------------------------- */
                $fileName = now()->timestamp
                    . "_BD{$detail->id}"
                    . "_{$index}_"
                    . uniqid()
                    . "." . $file->getClientOriginalExtension();

                /* ---------------------------------------------
                 | STORE FILE DIRECTLY IN /public
                 --------------------------------------------- */
                $relativePath = 'uploads/bookings/applicants/reports/' . $fileName;

                Storage::disk('public_uploads')->putFileAs(
                    'uploads/bookings/applicants/reports',
                    $file,
                    $fileName
                );

                /* ---------------------------------------------
                 | Read metadata AFTER storage
                 --------------------------------------------- */
                $categoryId = (int) $request->input("report_items.$index.category_id");
                $testId = (int) $request->input("report_items.$index.test_id");
                $notes = html_entity_decode(
                    $request->input("report_items.$index.notes", '')
                );

                /* ---------------------------------------------
                 | Insert DB row
                 --------------------------------------------- */
                $reportItemId = DB::table('timd_booking_report_items')->insertGetId([
                    'booking_detail_id' => $detail->id,
                    'category_id' => $categoryId,
                    'test_id' => $testId,
                    'notes' => $notes,
                    'file_path' => $relativePath, // 👈 public-relative
                    'file_name' => $fileName,
                    'mime_type' => $file->getClientMimeType(),
                    'file_size' => $file->getSize(),
                    'is_shared' => $request->boolean('share_report') ? 1 : 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $insertedIds[] = $reportItemId;
            }

            if (empty($insertedIds)) {
                throw new \Exception('No valid report files uploaded.');
            }

            /* ---------------------------------------------
             | Update booking detail
             --------------------------------------------- */
            $detail->update([
                'report_media_json' => implode(',', $insertedIds),
                'report_uploaded_by' => auth()->id(),
                'report_uploaded_on' => now(),
                'report_status' => $request->boolean('share_report')
                    ? BookingDetail::REPORT_SHARED
                    : ($request->boolean('is_final_submission')
                        ? BookingDetail::REPORT_UPLOADED
                        : BookingDetail::REPORT_PARTIALLY_UPLOADED),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Reports uploaded successfully',
                'ids' => $insertedIds,
            ]);

        } catch (\Throwable $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to upload report',
                'error' => $e->getMessage(),
            ], 500);
        }
    }




    /**
     * ✅ Upload and link bill file using Spatie Media Library
     */
    public function uploadBill(Request $request, $id)
    {
        try {
            $detail = BookingDetail::findOrFail($id);

            // 🚫 BLOCK IF BOOKING IS HOLD
            if ($detail->booking?->is_hold == 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Booking is on HOLD — Bill upload blocked.',
                ], 403);
            }

            // ---------------------------------------------------------
            // Ensure uploads folder exists & permission is correct
            // ---------------------------------------------------------
            $uploadPath = public_path('uploads');

            try {
                if (!file_exists($uploadPath)) {
                    mkdir($uploadPath, 0755, true);
                    chmod($uploadPath, 0755);
                    Log::info('📁 Created uploads folder with 0755 permissions');
                } else {
                    chmod($uploadPath, 0755);
                    Log::info('🔧 Updated uploads folder permissions to 0755');
                }
            } catch (\Throwable $permEx) {
                Log::error('❌ Cannot set upload folder permission', [
                    'error' => $permEx->getMessage(),
                ]);
            }

            $request->validate([
                'bill_media_notes' => 'nullable|string|max:2000',
                'bill_media' => 'required|file|mimes:pdf,png,jpg,jpeg|max:10240',
            ]);

            // Remove old bill
            if ($detail->hasMedia('bills')) {
                $detail->clearMediaCollection('bills');
            }

            // Store new bill file
            $file = $request->file('bill_media');
            $media = $detail
                ->addMedia($file)
                ->usingFileName(time() . '_' . $file->getClientOriginalName())
                ->usingName($file->getClientOriginalName())
                ->toMediaCollection('bills', 'uploads');

            // Update DB fields
            $detail->update([
                'bill_media_id' => $media->id,
                'bill_media_notes' => $request->input('bill_media_notes'),
                'bill_uploaded_by' => Auth::id(),
                'bill_uploaded_on' => Carbon::now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Bill uploaded successfully',
                'bill_media_id' => $media->id,
                'media_url' => $media->getFullUrl(),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Bill upload error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Bill upload failed. Please try again.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function exportList(Request $request)
    {
        try {
            $query = $this->baseQuery($request)
                ->with(['company:id,name', 'office:id,office_name'])
                ->select([
                    'id',
                    'brn',
                    'company_id',
                    'office_id',
                    'pref_appointment_date',
                    'preferred_collection_mode',
                    'booking_status',
                    'notes',
                    'total_employees',
                    'total_dependents',
                    'created_on',
                ])
                ->get();

            if ($query->isEmpty()) {
                return response()->json(['message' => 'No records found to export'], 404);
            }

            $data = $query->map(function ($r) {
                return [
                    'Sys ID' => $r->id,
                    'BRN' => $r->brn,
                    'Company' => optional($r->company)->name,
                    'Office' => optional($r->office)->office_name,
                    'Preferred Date' => optional($r->pref_appointment_date)?->format('d-m-Y'),
                    'Collection Mode' => $r->preferred_collection_mode ?? '-',
                    'Status' => ucfirst($r->booking_status),
                    'Notes' => $r->notes ?? '',
                    'Total Employees' => $r->total_employees,
                    'Total Dependents' => $r->total_dependents,
                    'Total Applicants' => ($r->total_employees ?? 0) + ($r->total_dependents ?? 0),
                    'Created On' => optional($r->created_on)?->format('d-m-Y H:i'),
                ];
            });

            // ✅ Download the Excel
            return \Maatwebsite\Excel\Facades\Excel::download(
                new \App\Exports\ArrayExport($data->toArray()),
                'bookings_export_' . now()->format('Ymd_His') . '.xlsx'
            );
        } catch (\Throwable $e) {
            Log::error('Booking exportList failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['message' => 'Export failed', 'error' => $e->getMessage()], 500);
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
}
