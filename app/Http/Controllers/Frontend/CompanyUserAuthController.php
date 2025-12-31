<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanyOffice;
use App\Models\CompanyUser;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CompanyUserAuthController extends Controller
{
    public function login(Request $request)
    {
        $validation = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required|string|min:4',
        ]);

        if ($validation->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validation->errors(),
            ], 422);
        }

        // ✅ Fetch user
        $user = CompanyUser::with(['company', 'role'])
            ->where('email', $request->email)
            ->first();

        // Case: invalid credentials
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid Credentials. Please check your credentials, and try again.',
            ], 401);
        }

        // Case: inactive/blocked account
        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Account inactive or blocked. Please contact support.',
            ], 403);
        }

        // ✅ Generate token
        $token = $user->createToken('company-user-token')->plainTextToken;

        // ✅ Get company
        $company = $user->company;

        // ✅ Get offices
        $offices = collect();
        if ($user->role && strtolower($user->role->role_name) === 'company_admin') {
            $offices = CompanyOffice::where('company_id', $company->id)
                ->where('status', 'active')
                ->get();
        } elseif ($user->role && strtolower($user->role->role_name) === 'company_executive') {
            $officeIds = $user->company_office_id;
            $offices = CompanyOffice::whereIn('id', $officeIds)
                ->where('status', 'active')
                ->get();
        }

        $offices = $offices->map(function ($office) {
            return [
                'office_id'       => $office->id,
                'office_name'     => $office->office_name,
                'collection_mode' => $office->allowed_collection_mode,
                'address'         => $office->address_line_1,
                'status'          => $office->status,
            ];
        });

        $user->last_login = Carbon::now();
        $user->save();

        // ✅ Success response
        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'id'           => $user->id,
                'first_name'   => $user->name,
                'email'        => $user->email,
                'phone_number' => $user->phone,
                'role_id'      => $user->role_id,
                'role_name'    => $user->role->role_name ?? null,
                'role_title'   => $user->role->role_title ?? null,
                'role_for'     => $user->role->role_for ?? null,
                'comp_name'    => $company->name ?? '',
                'last_login'   => Carbon::now()->format('Y-m-d H:i'),
                'updated_at'   => $user->updated_on,
                'token'        => $token,
                'is_primary'   => (bool) $user->is_primary,
                'is_tester'    => (bool) $user->is_tester,
                'office_ids'   => $user->company_office_id,
                'status'       => $user->status,
            ],
            'company_and_offices' => [
                'company_id'     => $company->id ?? null,
                'company_name'   => $company->name ?? '',
                'logo'           => $company?->logo ? asset('storage/' . $company->logo) : null,
                'company_status' => $company->status ?? 'active',
                'offices'        => $offices,
            ]
        ]);
    }
    public function updateProfile(Request $request)
{
    $user = $request->user();

    $validated = $request->validate([
        'name'        => 'required|string|max:255',
        'email'       => 'required|email',
        'phone'       => 'nullable|string|max:20',
        'designation' => 'nullable|string|max:255',
        'status'      => 'nullable|string|max:50',
        'password'    => 'nullable|string|min:6|confirmed',
    ]);

    if (!empty($validated['password'])) {
        $validated['password'] = Hash::make($validated['password']);
    } else {
        unset($validated['password']);
    }

    // Prevent company_id and office_ids modification
    unset($validated['company_id'], $validated['company_office_id']);

    $user->update($validated);

    return response()->json([
        'success' => true,
        'message' => 'Profile updated successfully.',
        'data'    => $user,
    ]);
}


    public function details(Request $request)
{
    $user = $request->user();

    $company = \App\Models\Company::select('id', 'name')->find($user->company_id);
    $offices = \App\Models\CompanyOffice::whereIn('id', (array) $user->company_office_id)
        ->select('id', 'office_name')
        ->get();

    return response()->json([
        'success' => true,
        'message' => 'User details fetched successfully',
        'data'    => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'designation' => $user->designation,
            'status' => $user->status,
            'company' => [
                'id' => $company->id ?? null,
                'name' => $company->name ?? '-',
            ],
            'offices' => $offices,
        ],
    ]);
}



    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout successful',
        ]);
    }
}
