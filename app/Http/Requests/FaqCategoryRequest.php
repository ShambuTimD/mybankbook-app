<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FaqCategoryRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

  public function rules()
{
    return [
        'name'       => 'required|string|max:255',
        'sort_order' => 'required|integer|min:0|unique:timd_hpbms_faq_categories,sort_order',
        'is_active'  => 'required|boolean',
    ];
}


}
