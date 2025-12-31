<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\CompanyOffice;
use App\Rules\AllowedCollectionMode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Yajra\DataTables\DataTables;

// use Illuminate\Support\Facades\Log;

class CompanyOfficeController extends Controller
{
    public function index()
    {
        return Inertia::render('Offices/Index');
    }

    public function list(Request $request)
    {
        $query = CompanyOffice::with('company')
            ->select([
                'timd_hpbms_comp_offices.*',   // fetch ALL office fields
            ]);

        return DataTables::of($query)
            ->addColumn('company_name', function ($row) {
                return $row->company->name ?? '-';
            })
            ->addColumn('allowed_collection_mode', function ($row) {
                if (! $row->allowed_collection_mode) {
                    return '-';
                }

                $modes = explode(',', $row->allowed_collection_mode);
                $labels = array_map(function ($mode) {
                    return match (trim($mode)) {
                        'at_home' => 'At-Home',
                        'at_clinic' => 'At-Clinic',
                        default => ucfirst(str_replace('_', ' ', $mode)),
                    };
                }, $modes);

                return implode(', ', $labels);
            })
            ->addColumn('action', fn () => '') // React renders action menu
            ->make(true);
    }

    public function create()
    {
        $companies = Company::select('id', 'name')->get();

        return Inertia::render('Offices/Create', [
            'companies' => $companies,
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
            'company_id' => 'required|exists:timd_hpbms_companies,id',
            'office_name' => 'required|string|max:255',
            'address_line_1' => 'nullable|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:20',
            'status' => 'required|in:active,inactive',
            'allowed_collection_mode' => ['nullable', new AllowedCollectionMode],
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

        // ✅ Convert allowed_collection_mode array to clean comma-separated string
        if (! empty($validated['allowed_collection_mode'])) {
            if (is_array($validated['allowed_collection_mode'])) {
                $modes = array_map(function ($item) {
                    return trim(trim($item), '"[]');
                }, $validated['allowed_collection_mode']);
                $modes = array_filter($modes);
                $validated['allowed_collection_mode'] = implode(',', $modes);
            }
        }

        // Meta fields
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
            'office' => $companyOffice,
            'companies' => $companies,
        ]);
    }

    // public function update(Request $request, CompanyOffice $companyOffice)
    // {
    //     $validated = $request->validate([
    //         'company_id'     => 'required|exists:timd_hpbms_companies,id',
    //         'office_name'    => 'required|string|max:255',
    //         'address_line_1' => 'nullable|string|max:255',
    //         'address_line_2' => 'nullable|string|max:255',
    //         'city'           => 'nullable|string|max:100',
    //         'state'          => 'nullable|string|max:100',
    //         'country'        => 'nullable|string|max:100',
    //         'pincode'        => 'nullable|string|max:20',
    //         'status'         => 'required|in:active,inactive',
    //     ]);

    //     // ✅ Re-apply prefix (handles changed company_id + avoids duplicates)
    //     $validated['office_name'] = $this->prefixedOfficeName(
    //         (int) $validated['company_id'],
    //         (string) $validated['office_name']
    //     );

    //     $validated['updated_by'] = Auth::id();
    //     $validated['updated_on'] = now();

    //     $companyOffice->update($validated);

    //     return redirect()->route('companyOffice.index')->with('success', 'Office updated successfully.');
    // }

    public function update(Request $request, CompanyOffice $companyOffice)
    {
        $validated = $request->validate([
            'company_id' => 'required|exists:timd_hpbms_companies,id',
            'office_name' => 'required|string|max:255',
            'address_line_1' => 'nullable|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:20',
            'status' => 'required|in:active,inactive',
            'allowed_collection_mode' => ['nullable', new AllowedCollectionMode],
        ]);

        // Normalize office name
        $normalizedName = $this->prefixedOfficeName(
            (int) $validated['company_id'],
            (string) $validated['office_name']
        );
        $validated['office_name'] = $normalizedName;

        // Convert allowed_collection_mode to clean comma-separated string
        if (! empty($validated['allowed_collection_mode'])) {
            if (is_array($validated['allowed_collection_mode'])) {
                $modes = array_map(function ($item) {
                    return trim(trim($item), '"[]');
                }, $validated['allowed_collection_mode']);
                $modes = array_filter($modes);
                $validated['allowed_collection_mode'] = implode(',', $modes);
            }
        }

        // Duplicate check
        $exists = CompanyOffice::where('office_name', $normalizedName)
            ->where('id', '!=', $companyOffice->id)
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'office_name' => 'An office with this name already exists for the company.',
            ])->withInput();
        }

        // Meta
        $validated['updated_by'] = Auth::id();
        $validated['updated_on'] = now();

        // Update
        $companyOffice->update($validated);

        return redirect()
            ->route('companyOffice.index')
            ->with('success', 'Office updated successfully.');
    }

    /**
     * Build an idempotent "<CompanyName>-<OfficeName>" string.
     * - Strips any existing "<CompanyName> -" or "<CompanyName>-" prefix (case-insensitive)
     * - Trims extra spaces around the hyphen
     */
    private function prefixedOfficeName(int $companyId, string $officeName): string
    {
        $company = Company::find($companyId);
        if (! $company) {
            return trim($officeName);
        }

        $prefix = trim($company->short_name);

        // Remove existing prefix forms: "Company-Name", "Company - Name", "company - name" (case-insensitive)
        $pattern = '/^'.preg_quote($prefix, '/').'\s*-\s*/i';
        $cleanName = preg_replace($pattern, '', $officeName) ?? $officeName;

        // Final normalized form: "CompanyName-OfficeName"
        return trim($prefix).'-'.trim($cleanName);
    }

    public function toggleStatus(CompanyOffice $companyOffice)
    {
        // Log::info('Toggle hit for ID '.$companyOffice->id);
        $companyOffice->status = $companyOffice->status === 'active' ? 'inactive' : 'active';
        $companyOffice->updated_by = Auth::id();
        $companyOffice->updated_on = now();
        $companyOffice->save();

        return response()->json([
            'success' => true,
            'status' => $companyOffice->status,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $hasOffices = DB::table('timd_hpbms_comp_users')
            ->where('company_office_id', $id)
            ->exists();

        if ($hasOffices) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete office. User exist for this office.',
            ], 422);
        }

        CompanyOffice::destroy($id);

        return response()->json([
            'success' => true,
            'message' => 'Office deleted successfully',
        ]);
    }
}
