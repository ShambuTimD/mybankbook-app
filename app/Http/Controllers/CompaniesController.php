<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Companies;
use App\Models\User;
use Yajra\DataTables\DataTables;
use Illuminate\Support\Facades\Storage;

class CompaniesController extends Controller
{
    public function index()
    {
        return Inertia::render('Companies/Index', [
            
        ]);
    }

    public function list(Request $request)
    {
        return DataTables::of(Companies::query())
            ->addIndexColumn()
            ->editColumn('logo', function ($company) {
                return $company->logo ? asset('storage/' . $company->logo) : null;
            })
            ->addColumn('action', function ($company) {
                return [
                    'id' => $company->id,
                    'edit_url' => route('companies.edit', $company->id),
                    'delete_url' => route('companies.delete', $company->id),
                ];
            })
            ->toJson();
    }

    public function create()
    {
        return Inertia::render('Companies/Create', [
            'users' => User::all(), // Optional
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_name'     => 'required|string|max:255',
            'brand_title'      => 'nullable|string|max:255',
            'company_address'  => 'nullable|string',
            'logo'             => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'status'           => 'required|in:active,inactive',
        ]);

        if ($request->hasFile('logo')) {
            $validated['logo'] = $request->file('logo')->store('uploads/logos', 'public');
        }

        Companies::create($validated);

        return redirect()->route('companies.index')->with('success', 'Company created successfully.');
    }

    public function edit(Companies $company)
    {
        return Inertia::render('Companies/Edit', [
            'company' => $company,
            'users' => User::all(),
        ]);
    }

    public function update(Request $request, Companies $company)
    {
        $validated = $request->validate([
            'company_name'     => 'required|string|max:255',
            'brand_title'      => 'nullable|string|max:255',
            'company_address'  => 'nullable|string',
            'logo'             => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'status'           => 'nullable|in:active,inactive',
        ]);

        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($company->logo && Storage::disk('public')->exists($company->logo)) {
                Storage::disk('public')->delete($company->logo);
            }
            $validated['logo'] = $request->file('logo')->store('uploads/logos', 'public');
        }

        $company->update($validated);

        return redirect()->route('companies.index')->with('success', 'Company updated successfully.');
    }

    public function destroy(Companies $company)
    {
        // Optionally delete logo
        if ($company->logo && Storage::disk('public')->exists($company->logo)) {
            Storage::disk('public')->delete($company->logo);
        }

        $company->delete();

        return redirect()->route('companies.index')->with('success', 'Company deleted successfully.');
    }
}
