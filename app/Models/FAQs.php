<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FAQs extends Model
{
    protected $table = 'timd_hpbms_faqs';

    protected $fillable = [
        'category_id',
        'question',
        'answer',
        'is_active',
        'sort_order',
    ];

    public function category()
    {
        return $this->belongsTo(FAQCategory::class, 'category_id');
    }
}
