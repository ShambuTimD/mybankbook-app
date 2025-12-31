<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FaqRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

   public function rules()
{
    $faqId = $this->route('id'); // For update request

    return [
        'category_id' => 'required|exists:timd_hpbms_faq_categories,id',
        'question'    => 'required|string|max:255',
        'answer'      => 'required|string',
        'is_active'   => 'required|boolean',

        // ⭐ Unique sort_order per category
        'sort_order'  => [
            'nullable',
            'integer',
            'min:0',
            \Illuminate\Validation\Rule::unique('timd_hpbms_faqs', 'sort_order')
                ->where('category_id', $this->category_id)
                ->ignore($faqId),
        ],
    ];
}

}
