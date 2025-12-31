<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Customers;
use App\Models\Notification;
use App\Models\User;
use Yajra\DataTables\DataTables;
use Illuminate\Support\Facades\Auth;

class CustomersController extends Controller
{

    public function index()
    {
        return Inertia::render('Customers/Index', [
            'title' => 'Customer'
        ]);
    }
    public function create()
    {
        return Inertia::render('Customers/Create', [
            'users' => User::all(),
        ]);
    }
    public function list(Request $request)
    {
        return DataTables::of(Customers::with(['createdBy', 'updatedBy', 'deletedBy']))
            ->addIndexColumn()
            ->addColumn('action', function ($customer) {
                return ''; // handled by DataTable slot in React
            })
            ->rawColumns(['action'])
            ->make(true);
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email_id' => 'nullable|email|max:255',
            'phone_number' => 'required|string|max:10|unique:customers,phone_number',
            'passcode' => 'nullable|string|max:255',
            'password' => 'nullable|string|min:8',
        ]);

        $customer = Customers::create($request->all());

        // Store notification in custom `notifications` table
        Notification::create([
            'customer_id'       => $customer->id,
            'message'           => 'A new customer account has been created.',
            'long_content'      => 'Welcome ' . $customer->first_name . '! Your account has been successfully registered.',
            'source'            => 'system',
            'notification_type' => 'system_gen',
            'date_time'         => now(),
            'is_read'           => 'unread',
            'created_by'        => Auth::id(), // Or null if guest
        ]);

        return redirect()->route('customer.index')->with('success', 'Customer created successfully.');
    }

    public function edit(Customers $customer)
    {
        return Inertia::render('Customers/Edit', [
            'customer' => $customer,
            'users' => User::all(),
        ]);
    }
    public function update(Request $request, Customers $customer)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email_id' => 'nullable|email|max:255',
            'phone_number' => 'required|string|max:13|unique:customers,phone_number,' . $customer->id,
            'passcode' => 'nullable|string|max:255',
            'password' => 'nullable|string|min:8',
        ]);
        $customer->update($request->all());
        return redirect()->route('customer.index');
    }
    public function destroy(Customers $customer)
    {
        $customer->delete();
        return redirect()->route('customer.index');
    }
}
