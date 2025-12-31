<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Dependents extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'name',
        'age',
        'gender',
        'phone',
        'email',
        'relation',
        'conditions',
        'other_condition'
    ];

    protected $casts = [
        'conditions' => 'array',
    ];

    public function employee()
    {
        return $this->belongsTo(Employees::class);
    }
}
