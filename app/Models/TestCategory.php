<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TestCategory extends Model
{
    protected $table = 'test_categories';

    protected $fillable = ['name', 'slug', 'status'];

    public function tests()
    {
        return $this->hasMany(Test::class, 'test_category_id');
    }
}
