<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Yajra\DataTables\DataTables;
use Illuminate\Support\Facades\Redirect;

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
        ->when($request->company_id, fn ($q) => $q->where('company_id', $request->company_id))
        ->when($request->office_id, fn ($q) => $q->where('office_id', $request->office_id))
        // important: ignore "all" and empty, match status in lowercase
        ->when($status && $status !== 'all', fn ($q) =>
            $q->whereRaw('LOWER(booking_status) = ?', [$status])
        )
        ->when($request->q, fn ($q) => $q->where('brn', 'like', "%{$request->q}%"))
        ->when($request->date_from, fn ($q) => $q->whereDate('pref_appointment_date', '>=', $request->date_from))
        ->when($request->date_to, fn ($q) => $q->whereDate('pref_appointment_date', '<=', $request->date_to))
        ->orderByDesc('created_on');
}

    public function index(Request $request)
    {
        return Inertia::render('Bookings/Index', [
            'title' => 'Bookings',
            'filters' => [
                'company_id'     => $request->company_id,
                'office_id'      => $request->office_id,
                'booking_status' => $request->booking_status,
                'q'              => $request->q,
                'date_from'      => $request->date_from,
                'date_to'        => $request->date_to,
            ],
            'statusOptions' => ['pending', 'confirmed', 'cancelled', 'completed'],
        ]);
    }

    public function list(Request $request)
    {
        $query = $this->baseQuery($request)->select([
            'id','company_id','office_id','brn','pref_appointment_date',
            'booking_status','total_employees','total_dependents','created_on',
        ]);

        return DataTables::of($query)
            ->addIndexColumn()
            ->editColumn('pref_appointment_date', fn ($r) => optional($r->pref_appointment_date)->format('Y-m-d'))
            ->editColumn('created_on', fn ($r) => optional($r->created_on)->format('Y-m-d H:i'))
            ->addColumn('company', fn ($r) => $r->company?->name)
            ->addColumn('office', fn ($r) => $r->office?->office_name)
            ->addColumn('total_applicants', fn ($r) => (int)$r->total_employees + (int)$r->total_dependents)
            ->addColumn('action', function ($r) {
                return [
                    'id'          => $r->id,
                    'view_url'    => route('booking.show', $r->id),     // JSON (for modal)
                    'edit_url'    => route('booking.edit', $r->id),     // Edit page
                    'status_url'  => route('booking.status', $r->id),   // PATCH status
                    'delete_url'  => route('booking.destroy', $r->id),  // DELETE
                ];
            })
            ->toJson();
    }

    public function show($id)
    {
        $booking = Booking::with([
            'company:id,name,short_name',
            'office:id,company_id,office_name,city,state',
            'requestedBy:id,name,email,phone',
            'details' => fn ($q) => $q->orderBy('id'),
            'details.employee:id,company_id,name,email,phone,gender,dob,age,designation',
            'details.dependent:id,emp_id,emp_relation,name,gender,age',
        ])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $booking]);
    }

    // Edit page for status update
   
public function edit($id)
{
    // Load master + relations + totals for the Edit page
    $booking = Booking::with([
            'company:id,name',
            'office:id,office_name',
            'requestedBy:id,name,email,phone',
            // show applicants in the Edit page
            'details' => fn($q) => $q->orderBy('id'),
            'details.employee:id,name,email,phone,gender,dob,age,designation',
            'details.dependent:id,emp_id,emp_relation,name,gender,age',
        ])
        ->select([
            'id',
            'brn',
            'booking_status',
            'pref_appointment_date',
            'company_id',
            'office_id',
            // 👇 these were missing, so totals showed blank
            'total_employees',
            'total_dependents',
            'created_on',
        ])
        ->findOrFail($id);

    return Inertia::render('Bookings/Edit', [
        'title'         => 'Edit Booking',
        'booking'       => $booking,
        'statusOptions' => ['pending','confirmed','cancelled','completed'],
        // reuse status PATCH route
        'updateRoute'   => route('booking.status', $booking->id),
    ]);
}

    // API: status update (used by edit form and index quick actions)
    // public function updateStatus(Request $request, $id)
    // {
    //     $request->validate([
    //         'booking_status' => ['required', 'in:pending,confirmed,cancelled,completed'],
    //     ]);

    //     $booking = Booking::findOrFail($id);
    //     $from = $booking->booking_status;
    //     $to   = $request->booking_status;

    //     $allowed = [
    //         'pending'   => ['confirmed','cancelled'],
    //         'confirmed' => ['completed','cancelled'],
    //         'cancelled' => [],
    //         'completed' => [],
    //     ];
    //     if (!in_array($to, $allowed[$from] ?? [], true)) {
    //         return response()->json([
    //             'success' => false,
    //             'status'  => 'error',
    //             'message' => "Invalid status transition: {$from} → {$to}",
    //         ], 422);
    //     }

    //     $booking->update(['booking_status' => $to, 'updated_by' => Auth::id()]);

    //     if ($to === 'cancelled') {
    //         BookingDetail::where('booking_id', $booking->id)
    //             ->where('status', 'scheduled')
    //             ->update(['status' => 'cancelled', 'updated_by' => Auth::id()]);
    //     }

    //     return response()->json(['success' => true, 'status' => 'success', 'message' => "Booking status updated to {$to}."]);
    // }
    public function updateStatus(Request $request, $id)
{
    $request->validate([
        'booking_status' => ['required', 'in:pending,confirmed,cancelled,completed'],
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
        // Inertia form error vs JSON error
        if ($request->header('X-Inertia')) {
            return Redirect::back()->withErrors([
                'booking_status' => "Invalid status transition: {$from} → {$to}",
            ]);
        }
        return response()->json([
            'success' => false,
            'status'  => 'error',
            'message' => "Invalid status transition: {$from} → {$to}",
        ], 422);
    }

    $booking->update([
        'booking_status' => $to,
        'updated_by'     => Auth::id(),
    ]);

    if ($to === 'cancelled') {
        BookingDetail::where('booking_id', $booking->id)
            ->where('status', 'scheduled')
            ->update([
                'status'     => 'cancelled',
                'updated_by' => Auth::id(),
            ]);
    }

    $msg = "Booking status updated to {$to}.";

    // If called via Inertia (your edit page or router.patch), redirect with flash
    if ($request->header('X-Inertia')) {
        return Redirect::route('booking.index')->with('success', $msg);
    }

    // Fallback for non-Inertia callers
    return response()->json([
        'success' => true,
        'status'  => 'success',
        'message' => $msg,
    ]);
}

    // HARD delete booking + details (transaction-safe)
    public function destroy($id)
    {
        DB::transaction(function () use ($id) {
            BookingDetail::where('booking_id', $id)->delete();
            Booking::where('id', $id)->delete();
        });

        return response()->json(['success' => true, 'message' => 'Booking deleted successfully.']);
    }
}
