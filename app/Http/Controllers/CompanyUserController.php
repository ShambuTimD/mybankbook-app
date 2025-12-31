<?php

namespace App\Http\Controllers;

use App\Models\CompanyUser;
use App\Models\Company;
use App\Models\CompanyOffice;
use App\Models\Role;
use App\Rules\AllowedCollectionMode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Yajra\DataTables\DataTables;
use Illuminate\Support\Facades\Hash;

class CompanyUserController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('CompanyUser/Index', [
            'title' => 'Company User',
        ]);
    }

    public function list(Request $request)
    {
        if ($request->wantsJson() || $request->ajax()) {
            $query = CompanyUser::with(['company', 'role'])
                ->select([
                    'id',
                    'company_id',
                    'company_office_id',
                    'name',
                    'email',
                    'phone',
                    'role_id',
                    'status',
                    'last_login',
                    'created_on as created_at',
                ]);

            return DataTables::of($query)
                ->addIndexColumn()
                ->addColumn('company', fn($row) => $row->company->name ?? '-')
                ->addColumn('role', fn($row) => $row->role->role_title ?? '-')
                ->addColumn('office', fn($row) => $row->office_names ?: '-') // accessor on model
                ->addColumn('action', fn() => '') // handled in React
                ->make(true);
        }

        abort(403);
    }

    public function create(): Response
    {
        return Inertia::render('CompanyUser/Create', [
            'title'     => 'Company User',
            'companies' => Company::all(),
            'offices'   => CompanyOffice::all(),
            'roles'     => Role::where('is_active', 1)->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_id'          => 'required|exists:timd_hpbms_companies,id',
            'company_office_id'   => 'nullable|array',
            'company_office_id.*' => 'integer|exists:timd_hpbms_comp_offices,id',
            'name'                => 'required|string|max:255',
            'email'               => 'required|email|unique:timd_hpbms_comp_users,email',
            'password'            => 'required|string|min:6',
            'role_id'             => 'required|exists:roles,id',
            'phone'               => 'nullable|string|max:20',
            'status'              => 'required|in:active,inactive',
            'is_primary'          => 'nullable|boolean',
            'is_tester'           => 'nullable|boolean',
            'allowed_collection_mode' => ['nullable', new AllowedCollectionMode],  // Apply the custom rule
        ]);

        $role = Role::find($validated['role_id']);
        if ($role && in_array(strtolower($role->role_name), ['company_executive', 'company_executive_manager'])) {
            $request->validate([
                'company_office_id'   => 'required|array|min:1',
                'company_office_id.*' => 'integer|exists:timd_hpbms_comp_offices,id',
            ]);
        }

        // Convert allowed_collection_mode array to a comma-separated string for storage
        if (!empty($validated['allowed_collection_mode'])) {
            $validated['allowed_collection_mode'] = implode(',', $validated['allowed_collection_mode']);
        }

        $validated['password']   = Hash::make($validated['password']);
        $validated['created_by'] = Auth::id();
        $validated['is_primary'] = $request->boolean('is_primary');
        $validated['is_tester']  = $request->boolean('is_tester');

        CompanyUser::create($validated);

        return redirect()
            ->route('companyUser.index')
            ->with('success', 'Company user created successfully.');
    }



    public function edit($id): Response
    {
        $user      = CompanyUser::with('role')->findOrFail($id);
        $companies = Company::all();
        $offices   = CompanyOffice::all();
        $roles     = Role::where('is_active', 1)->get();

        return Inertia::render('CompanyUser/Edit', [
            'title'     => 'Company User',
            'user'      => [
                ...$user->toArray(),
                'role_for' => $user->role?->role_for ?? '',
            ],
            'companies' => $companies,
            'offices'   => $offices,
            'roles'     => $roles,
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = CompanyUser::findOrFail($id);

        // Base validation
        $validated = $request->validate([
            'company_id'          => 'nullable|exists:timd_hpbms_companies,id',
            'company_office_id'   => 'nullable|array', // accept multi-select
            'company_office_id.*' => 'integer|exists:timd_hpbms_comp_offices,id',
            'name'                => 'required|string|max:255',
            'email'               => 'required|email|unique:timd_hpbms_comp_users,email,' . $user->id,
            'role_id'             => 'required|exists:roles,id',
            'phone'               => 'nullable|string|max:20',
            'status'              => 'required|in:active,inactive',
            'is_primary'          => 'nullable|boolean',
            'is_tester'           => 'nullable|boolean',
            'password'            => 'nullable|string|min:6', // password optional on edit
            'allowed_collection_mode' => ['nullable', new AllowedCollectionMode], // Apply the custom rule
        ]);

        // Conditional requirement: roles that must have office(s)
        $role = Role::find($validated['role_id']);
        if ($role && in_array(strtolower($role->role_name), ['company_executive', 'company_executive_manager'])) {
            $request->validate([
                'company_office_id'   => 'required|array|min:1',
                'company_office_id.*' => 'integer|exists:timd_hpbms_comp_offices,id',
            ]);
        }

        // Convert allowed_collection_mode array to a comma-separated string for storage
        if (array_key_exists('allowed_collection_mode', $validated)) {
            $validated['allowed_collection_mode'] = !empty($validated['allowed_collection_mode'])
                ? implode(',', $validated['allowed_collection_mode'])
                : null;
        }

        // Only hash if provided
        if (!empty($validated['password'])) {
            $validated['password'] = bcrypt($validated['password']);
        } else {
            unset($validated['password']);
        }

        $validated['is_primary'] = $request->boolean('is_primary');
        $validated['is_tester']  = $request->boolean('is_tester');
        $validated['updated_by'] = Auth::id();

        $user->update($validated);

        return redirect()
            ->route('companyUser.index')
            ->with('success', 'Company user updated successfully.');
    }

    public function toggleStatus(CompanyUser $companyUser)
    {
        $companyUser->status     = $companyUser->status === 'active' ? 'inactive' : 'active';
        $companyUser->updated_by = Auth::id();
        $companyUser->save();

        return response()->json([
            'success' => true,
            'status'  => $companyUser->status,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $hasOffices = DB::table('timd_hpbms_booking_master')
            ->where('office_id', $id)
            ->exists();

        if ($hasOffices) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete this user. Booking exist for this user.'
            ], 422);
        }

        CompanyUser::destroy($id);

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    }
}
