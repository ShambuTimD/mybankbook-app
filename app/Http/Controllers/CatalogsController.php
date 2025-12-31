<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Catalogs;
use App\Models\User;
use Yajra\DataTables\DataTables;
use Illuminate\Support\Facades\Storage;

class CatalogsController extends Controller
{
    public function index()
    {
        return Inertia::render('Catalogs/Index', [
            'title' => 'Catalog'
        ]);
    }

    public function list(Request $request)
    {
        return DataTables::of(Catalogs::query())
            ->addIndexColumn()
            ->editColumn('image', function ($catalog) {
                return $catalog->image ? asset('storage/' . $catalog->image) : null;
            })
            ->addColumn('action', function ($catalog) {
                return [
                    'id' => $catalog->id,
                    'edit_url' => route('catalogs.edit', $catalog->id),
                    'delete_url' => route('catalogs.delete', $catalog->id),
                ];
            })
            ->toJson();
    }

    public function create()
    {
        return Inertia::render('Catalogs/Create', [
            'users' => User::all(), // Optional: if you need user list
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'status'      => 'required|in:active,inactive',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('uploads/catalogs', 'public');
        }

        Catalogs::create($validated);

        return redirect()->route('catalogs.index')->with('success', 'Catalog created successfully.');
    }

    public function edit(Catalogs $catalog)
    {
        return Inertia::render('Catalogs/Edit', [
            'catalog' => $catalog,
            'users' => User::all(),
        ]);
    }

  public function update(Request $request, Catalogs $catalog)
{
    $validated = $request->validate([
        'name'        => 'required|string|max:255',
        'description' => 'nullable|string',
        'image'       => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        'status'      => 'nullable|in:active,inactive',
    ]);

    // Handle Image Upload
    if ($request->hasFile('image')) {
        // Delete the old image if it exists
        if ($catalog->image && Storage::disk('public')->exists($catalog->image)) {
            Storage::disk('public')->delete($catalog->image);
        }

        // Store the new image
        $validated['image'] = $request->file('image')->store('uploads/catalogs', 'public');
    } else {
        // If no new image is uploaded, retain the existing image
        $validated['image'] = $catalog->image;
    }

    // Update catalog with validated data
    $catalog->update($validated);

    return redirect()->route('catalogs.index')->with('success', 'Catalog updated successfully.');
}


    public function destroy(Catalogs $catalog)
    {
        // Optionally delete image
        if ($catalog->image && Storage::disk('public')->exists($catalog->image)) {
            Storage::disk('public')->delete($catalog->image);
        }

        $catalog->delete();

        return redirect()->route('catalogs.index')->with('success', 'Catalog deleted successfully.');
    }
}
