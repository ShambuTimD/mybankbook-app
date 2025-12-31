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

        // ✅ Get user with relations
        $user = CompanyUser::with(['company', 'role'])
            ->where('email', $request->email)
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        // ✅ Generate token
        $token = $user->createToken('company-user-token')->plainTextToken;

        // ✅ Get company
        $company = $user->company;

        // ✅ Offices logic by role
        $offices = collect();

        if ($user->role && strtolower($user->role->role_name) === 'company_admin') {
            // Company Admin → all active offices of the company
            $offices = CompanyOffice::where('company_id', $company->id)
                ->where('status', 'active')
                ->get();
        } elseif ($user->role && strtolower($user->role->role_name) === 'company_executive') {
            // Company Executive → only allocated offices
            $officeIds = $user->company_office_id; // accessor returns array
            $offices = CompanyOffice::whereIn('id', $officeIds)
                ->where('status', 'active')
                ->get();
        }

        return response()->json([
            'success' => true,
            'message' => 'Login Successful',
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
                // 👇 send office_ids array directly
                'office_ids'   => $user->company_office_id,
            ],
            'company_and_offices' => [
                'company_id'     => $company->id ?? null,
                'company_name'   => $company->name ?? '',
                'logo'           => $company?->logo ? asset('storage/' . $company->logo) : null,
                'company_status' => $company->status ?? 'active',
                'offices'        => $offices->map(function ($office) {
                    return [
                        'office_id'   => $office->id,
                        'office_name' => $office->office_name,
                        'address'     => $office->address_line_1 ?? '',
                        'status'      => $office->status ?? 'active',
                    ];
                }),
            ]
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
