<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FAQCategory extends Model
{
    protected $table = 'timd_hpbms_faq_categories';

    protected $fillable = [
        'name',
        'slug',
        'is_active',
        'sort_order',
    ];

    public $timestamps = true;
}
