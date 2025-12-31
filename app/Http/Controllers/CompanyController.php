<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Yajra\DataTables\DataTables;

class CompanyController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Companies/Index', [
            'title' => 'Company',
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
                'email',
                'logo',
                'status',
                'created_on as created_at' // alias if needed by DataTable
            ]);

        return DataTables::of($data)
            ->addIndexColumn()
            ->addColumn('action', function ($row) {
                return ''; // handled in React via slot
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
        'email' => 'required|email|max:255',
        'phone' => 'required|string|max:20',
        'alternate_phone' => 'nullable|string|max:20',
        'website' => 'nullable|string|max:255',
        'gst_number' => 'nullable|string|max:50',
        'pan_number' => 'nullable|string|max:50',
        'industry_type' => 'nullable|string|max:100',
        'company_size' => 'nullable|string|max:100',
        'registration_type' => 'nullable|string|max:100',
        'address_line_1' => 'required|string|max:255',
        'address_line_2' => 'nullable|string|max:255',
        'city' => 'required|string|max:100',
        'state' => 'required|string|max:100',
        'country' => 'required|string|max:100',
        'pincode' => 'required|string|max:20',
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

    Company::create($validated);

    return redirect()->route('companies.index')->with('success', 'Company created successfully');
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

    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|max:255',
        'phone' => 'required|string|max:20',
        'alternate_phone' => 'nullable|string|max:20',
        'website' => 'nullable|string|max:255',
        'gst_number' => 'nullable|string|max:50',
        'pan_number' => 'nullable|string|max:50',
        'industry_type' => 'nullable|string|max:100',
        'company_size' => 'nullable|string|max:100',
        'registration_type' => 'nullable|string|max:100',
        'address_line_1' => 'required|string|max:255',
        'address_line_2' => 'nullable|string|max:255',
        'city' => 'required|string|max:100',
        'state' => 'required|string|max:100',
        'country' => 'required|string|max:100',
        'pincode' => 'required|string|max:20',
        'status' => 'required|in:active,inactive',
        'logo' => 'nullable|file|mimes:jpeg,png,jpg,gif,svg|max:2048',
    ]);

    // Handle logo upload if a new file is provided
    if ($request->hasFile('logo')) {
        $logoPath = $request->file('logo')->store('uploads/logos', 'public');
        $validated['logo'] = $logoPath;
    }

    $company->update($validated);

    return redirect()->route('companies.index')->with('success', 'Company updated successfully');
}


    public function destroy($id)
    {
        Company::destroy($id);

        return redirect()->route('companies.index')->with('success', 'Company deleted successfully');
    }
        public function toggleStatus($id)
    {
        $company = Company::findOrFail($id);

        $company->status = $company->status === 'active' ? 'inactive' : 'active';
        $company->save();

        return response()->json([
            'success' => true,
            'status' => $company->status
        ]);
    }

}
