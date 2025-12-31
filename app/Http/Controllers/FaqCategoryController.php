<?php

namespace App\Http\Controllers;

use App\Models\FAQCategory;
use App\Http\Requests\FaqCategoryRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class FaqCategoryController extends Controller
{
    public function index()
    {
        $categories = FAQCategory::orderBy('sort_order')->get();

        return Inertia::render('FaqCategories/Index', [
            'categories' => $categories
        ]);
    }

    public function create()
    {
        return Inertia::render('FaqCategories/Create');
    }

    public function store(FaqCategoryRequest $request)
    {
        $data = $request->validated();

        // ⭐ Auto-generate slug from name
        $data['slug'] = Str::slug($data['name']);

        FAQCategory::create($data);

        return redirect()->route('faq.index')
            ->with('success', 'Category created successfully');
    }

    public function edit($id)
    {
        $category = FAQCategory::findOrFail($id);

        return Inertia::render('FaqCategories/Edit', [
            'category' => $category
        ]);
    }

    public function update(FaqCategoryRequest $request, $id)
    {
        $category = FAQCategory::findOrFail($id);

        $data = $request->validated();

        // ⭐ Automatically regenerate slug when name changes
        $data['slug'] = Str::slug($data['name']);

        $category->update($data);

        return redirect()->route('faq.category.index')
            ->with('success', 'Category updated successfully');
    }

    public function destroy($id)
    {
        FAQCategory::findOrFail($id)->delete();

        return back()->with('success', 'Category deleted');
    }

    public function checkSortOrder(Request $request)
{
    $request->validate([
        'sort_order' => 'required|integer|min:0',
    ]);

    $exists = FAQCategory::where('sort_order', $request->sort_order)->exists();

    return response()->json(['exists' => $exists]);
}

}
