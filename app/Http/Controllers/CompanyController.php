<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Yajra\DataTables\DataTables;

class CompanyController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Companies/Index', [
            'title' => 'Company',
            // 'flash' => session()->only(['success', 'error']), // Pass flash data
        ]);
    }

    // ✅ Needed for DataTables AJAX call
    // public function list(Request $request)
    // {
    //     if ($request->wantsJson() || $request->ajax()) {
    //         $data = Company::latest()->select(['id', 'name', 'email', 'logo', 'status']);
    //         return DataTables::of($data)
    //             ->addIndexColumn()
    //             ->addColumn('action', function ($row) {
    //                 return ''; // Filled in via React `ActionMenu` slot
    //             })
    //             ->make(true);
    //     }

    //     abort(403);
    // }
   public function list(Request $request)
{
    if ($request->wantsJson() || $request->ajax()) {
        $data = Company::orderBy('created_on', 'desc')
            ->select([
                'id',
                'name',
                'short_name',
                'logo',
                'email',
                'phone',
                'alternate_phone',
                'website',
                'gst_number',
                'pan_number',
                'industry_type',
                'company_size',
                'registration_type',
                'address_line_1',
                'address_line_2',
                'city',
                'state',
                'country',
                'pincode',
                'status',
                'created_on as created_at'
            ]);

        return DataTables::of($data)
            ->addIndexColumn()
            ->addColumn('action', function ($row) {
                return ''; // React handles UI buttons
            })
            ->make(true);
    }

    abort(403);
}



    public function create(): Response
    {
        return Inertia::render('Companies/Create', [
            'title' => 'Create Company',
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'short_name' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'alternate_phone' => 'nullable|string|max:20',
            'website' => 'nullable|string|max:255',
            'gst_number' => 'nullable|string|max:50',
            'pan_number' => 'nullable|string|max:50',
            'industry_type' => 'nullable|string|max:100',
            'company_size' => 'nullable|string|max:100',
            'registration_type' => 'nullable|string|max:100',
            'address_line_1' => 'nullable|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:20',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'status' => 'required|in:active,inactive',
        ]);
        if (empty($validated['short_name']) && !empty($validated['name'])) {
            $validated['short_name'] = strtoupper(substr($validated['name'], 0, 3));
        }
        // Handle logo upload
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('uploads/logos', 'public');
            $validated['logo'] = $path;
        }

        // Company::create($validated);

        // return redirect()->route('companies.index')->with('success', 'Company created successfully');

        try {
            Company::create($validated);
            return redirect()->route('companies.index')->with('success', 'Company created successfully');
        } catch (\Exception $e) {
            return redirect()->route('companies.index')->with('error', 'Failed to create company');
        }
    }


    public function show($id): Response
    {
        $company = Company::findOrFail($id);

        return Inertia::render('Companies/Show', [
            'title' => 'View Company',
            'company' => $company,
        ]);
    }

    public function edit($id): Response
    {
        $company = Company::findOrFail($id);

        return Inertia::render('Companies/Edit', [
            'title' => 'Edit Company',
            'company' => $company,
        ]);
    }

    public function update(Request $request, $id)
    {
        $company = Company::findOrFail($id);

        // ✅ Same validation as store()
        $validated = $request->validate([
            'name'              => 'required|string|max:255',
            'short_name'        => 'nullable|string|max:50',
            'email'             => 'nullable|email|max:255',
            'phone'             => 'nullable|string|max:20',
            'alternate_phone'   => 'nullable|string|max:20',
            'website'           => 'nullable|string|max:255',
            'gst_number'        => 'nullable|string|max:50',
            'pan_number'        => 'nullable|string|max:50',
            'industry_type'     => 'nullable|string|max:100',
            'company_size'      => 'nullable|string|max:100',
            'registration_type' => 'nullable|string|max:100',
            'address_line_1'    => 'nullable|string|max:255',
            'address_line_2'    => 'nullable|string|max:255',
            'city'              => 'nullable|string|max:100',
            'state'             => 'nullable|string|max:100',
            'country'           => 'nullable|string|max:100',
            'pincode'           => 'nullable|string|max:20',
            'logo'              => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'status'            => 'required|in:active,inactive',
        ]);

        // ✅ Auto-fill short_name just like store()
        if (empty($validated['short_name']) && !empty($validated['name'])) {
            $validated['short_name'] = strtoupper(substr($validated['name'], 0, 3));
        }

        // ✅ Handle logo upload (optional), same as store()
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('uploads/logos', 'public');
            $validated['logo'] = $path;
        }

        // $company->update($validated);

        // return redirect()->route('companies.index')->with('success', 'Company updated successfully');

        try {
            $company->update($validated);
            return redirect()->route('companies.index')->with('success', 'Company updated successfully');
        } catch (\Exception $e) {
            return redirect()->route('companies.index')->with('error', 'Failed to update company details');
        }
    }


    public function destroy(Request $request, $id)
    {
        $hasOffices = DB::table('timd_hpbms_comp_offices')
            ->where('company_id', $id)
            ->exists();

        if ($hasOffices) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete company. Offices exist for this company.'
            ], 422);
        }

        Company::destroy($id);

        return response()->json([
            'success' => true,
            'message' => 'Company deleted successfully'
        ]);
    }

    public function toggleStatus($id)
    {
        $company = Company::findOrFail($id);

        $company->status = $company->status === 'active' ? 'inactive' : 'active';
        $company->save();

        return response()->json([
            'success' => true,
            'status' => $company->status,
            'message' => "Status updated to {$company->status}"
        ]);
    }
}
