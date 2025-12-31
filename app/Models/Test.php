<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Test extends Model
{
    protected $table = 'tests';

    protected $fillable = [
        'test_code',
        'test_name',
        'test_category_id',
        'test_type',
        'sample_type',
        'fasting_required',
        'tat_hours',
        'status'
    ];

    public function category()
    {
        return $this->belongsTo(TestCategory::class, 'test_category_id');
    }
}
