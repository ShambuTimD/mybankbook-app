<?php

namespace App\Http\Controllers;

use App\Models\FAQs;
use App\Models\FAQCategory;
use App\Http\Requests\FaqRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FaqController extends Controller
{
    // ------------------------------------------------------------
    // INDEX PAGE (Only returns page, DataTable loads via AJAX)
    // ------------------------------------------------------------
    public function index()
    {
        return Inertia::render('Faqs/Index');
    }

    // ------------------------------------------------------------
    // DATATABLE LIST API
    // ------------------------------------------------------------
   public function list(Request $request)
{
    $query = FAQs::with('category')->orderBy('sort_order', 'ASC');

    return datatables()->eloquent($query)
        ->addColumn('category_name', fn($row) => $row->category->name ?? '-')
        ->addColumn('action', function ($row) {
            return '<span class="action-menu-mount" data-id="'.$row->id.'"></span>';
        })
        ->rawColumns(['action'])
        ->make(true);
}



    // ------------------------------------------------------------
    // CREATE FORM
    // ------------------------------------------------------------
    public function create()
    {
        return Inertia::render('Faqs/Create', [
            'categories' => FAQCategory::where('is_active', 1)->get(),
        ]);
    }

    // ------------------------------------------------------------
    // STORE FAQ
    // ------------------------------------------------------------
    public function store(FaqRequest $request)
    {
        FAQs::create($request->validated());

        return redirect()->route('faq.index')
            ->with('success', 'FAQ created successfully');
    }

    // ------------------------------------------------------------
    // EDIT FORM
    // ------------------------------------------------------------
    public function edit($id)
    {
        return Inertia::render('Faqs/Edit', [
            'faq' => FAQs::findOrFail($id),
            'categories' => FAQCategory::where('is_active', 1)->get(),
        ]);
    }

    // ------------------------------------------------------------
    // UPDATE
    // ------------------------------------------------------------
    public function update(FaqRequest $request, $id)
    {
        $faq = FAQs::findOrFail($id);
        $faq->update($request->validated());

        return redirect()->route('faq.index')
            ->with('success', 'FAQ updated successfully');
    }

    // ------------------------------------------------------------
    // DELETE
    // ------------------------------------------------------------
    public function destroy($id)
    {
      $faq = FAQs::find($id);

        if (!$faq) {
            return response()->json([
                'success' => false,
                'message' => 'FAQ already deleted or not found.'
            ], 404);
        }

        $faq->delete();

        return response()->json([
            'success' => true,
            'message' => 'FAQ deleted successfully.'
        ]);

    }

    // ------------------------------------------------------------
    // STATUS TOGGLE (for DataTable switch)
    // ------------------------------------------------------------
   public function toggleStatus($id)
{
    $faq = FAQs::find($id);

    if (!$faq) {
        return response()->json([
            'success' => false,
            'message' => 'FAQ not found'
        ], 404);
    }

    $faq->is_active = $faq->is_active ? 0 : 1;
    $faq->save();

    return response()->json([
        'success' => true,
        'message' => 'Status updated',
        'status' => $faq->is_active
    ]);
}

public function checkSortOrder(Request $request)
{
    $request->validate([
        'category_id' => 'required|exists:timd_hpbms_faq_categories,id',
        'sort_order'  => 'required|integer|min:0',
    ]);

    $exists = FAQs::where('category_id', $request->category_id)
                  ->where('sort_order', $request->sort_order)
                  ->exists();

    return response()->json(['exists' => $exists]);
}


}
