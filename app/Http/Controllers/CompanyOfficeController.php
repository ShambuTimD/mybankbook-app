<?php

namespace App\Http\Controllers;

use App\Models\CompanyOffice;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Yajra\DataTables\DataTables;
use Inertia\Inertia;

class CompanyOfficeController extends Controller
{
    public function index()
    {
        return Inertia::render('Offices/Index');
    }

    public function list(Request $request)
    {
        $query = CompanyOffice::with('company')
            ->select('timd_hpbms_comp_offices.*'); // ✅ correct table name

        return DataTables::of($query)
            ->addColumn('company_name', function ($row) {
                return $row->company->name ?? '-';
            })
            ->addColumn('action', function ($row) {
                return ''; // Render buttons in React
            })
            ->make(true);
    }

    public function create()
    {
        $companies = Company::select('id', 'name')->get();

        return Inertia::render('Offices/Create', [
            'companies' => $companies
        ]);
    }

    // public function store(Request $request)
    // {
    //     $validated = $request->validate([
    //         'company_id'     => 'required|exists:timd_hpbms_companies,id',
    //         'office_name'    => 'required|string|max:255',
    //         'address_line_1' => 'required|string|max:255',
    //         'address_line_2' => 'nullable|string|max:255',
    //         'city'           => 'nullable|string|max:100',
    //         'state'          => 'nullable|string|max:100',
    //         'country'        => 'nullable|string|max:100',
    //         'pincode'        => 'nullable|string|max:20',
    //         'status'         => 'required|in:active,inactive',
    //     ]);

    //     // ✅ Always save as "<CompanyName>-<OfficeName>" without double-prefixing
    //     $validated['office_name'] = $this->prefixedOfficeName(
    //         (int) $validated['company_id'],
    //         (string) $validated['office_name']
    //     );

    //     $validated['created_by'] = Auth::id();
    //     $validated['created_on'] = now();

    //     CompanyOffice::create($validated);

    //     return redirect()->route('companyOffice.index')->with('success', 'Office created successfully.');
    // }
    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_id'     => 'required|exists:timd_hpbms_companies,id',
            'office_name'    => 'required|string|max:255',
            'address_line_1' => 'required|string|max:255',
            'status'         => 'required|in:active,inactive',
        ]);

        // Normalize office name with prefix
        $validated['office_name'] = $this->prefixedOfficeName(
            (int) $validated['company_id'],
            (string) $validated['office_name']
        );

        // ✅ Duplicate check after normalization
        if (CompanyOffice::where('office_name', $validated['office_name'])->exists()) {
            return back()->withErrors([
                'office_name' => 'An office with this name already exists for the company.',
            ])->withInput();
        }

        $validated['created_by'] = Auth::id();
        $validated['created_on'] = now();

        CompanyOffice::create($validated);

        return redirect()->route('companyOffice.index')
            ->with('success', 'Office created successfully.');
    }

    public function edit(CompanyOffice $companyOffice)
    {
        $companies = Company::select('id', 'name')->get();

        return Inertia::render('Offices/Edit', [
            'office'    => $companyOffice,
            'companies' => $companies
        ]);
    }

    public function update(Request $request, CompanyOffice $companyOffice)
    {
        $validated = $request->validate([
            'company_id'     => 'required|exists:timd_hpbms_companies,id',
            'office_name'    => 'required|string|max:255',
            'address_line_1' => 'required|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city'           => 'nullable|string|max:100',
            'state'          => 'nullable|string|max:100',
            'country'        => 'nullable|string|max:100',
            'pincode'        => 'nullable|string|max:20',
            'status'         => 'required|in:active,inactive',
        ]);

        // ✅ Re-apply prefix (handles changed company_id + avoids duplicates)
        $validated['office_name'] = $this->prefixedOfficeName(
            (int) $validated['company_id'],
            (string) $validated['office_name']
        );

        $validated['updated_by'] = Auth::id();
        $validated['updated_on'] = now();

        $companyOffice->update($validated);

        return redirect()->route('companyOffice.index')->with('success', 'Office updated successfully.');
    }

    /**
     * Build an idempotent "<CompanyName>-<OfficeName>" string.
     * - Strips any existing "<CompanyName> -" or "<CompanyName>-" prefix (case-insensitive)
     * - Trims extra spaces around the hyphen
     */
    private function prefixedOfficeName(int $companyId, string $officeName): string
    {
        $company = Company::find($companyId);
        if (!$company) {
            return trim($officeName);
        }

        $prefix = trim($company->short_name);

        // Remove existing prefix forms: "Company-Name", "Company - Name", "company - name" (case-insensitive)
        $pattern = '/^' . preg_quote($prefix, '/') . '\s*-\s*/i';
        $cleanName = preg_replace($pattern, '', $officeName) ?? $officeName;

        // Final normalized form: "CompanyName-OfficeName"
        return trim($prefix) . '-' . trim($cleanName);
    }
    public function toggleStatus(CompanyOffice $companyOffice)
    {
        $companyOffice->status = $companyOffice->status === 'active' ? 'inactive' : 'active';
        $companyOffice->updated_by = Auth::id();
        $companyOffice->updated_on = now();
        $companyOffice->save();

        return response()->json([
            'success' => true,
            'status'  => $companyOffice->status,
        ]);
    }
}
