<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Emp extends Model
{
    use SoftDeletes;

    protected $table = 'timd_hpbms_emps';
    protected $guarded = []; // or specify fillable if you prefer

    // Your schema uses custom timestamp columns
    public const CREATED_AT = 'created_on';
    public const UPDATED_AT = 'updated_on';
    public const DELETED_AT = 'deleted_on';

    protected $dates = ['created_on', 'updated_on', 'deleted_on', 'dob'];
    protected $guards = ['booking_id']; // Assuming booking_id is not fillable

    protected $casts = [
        'age' => 'integer',
        'medical_conditions' => 'array', // <-- keep as array
    ];

    public function dependents()
    {
        return $this->hasMany(EmpDependent::class, 'emp_id');
    }
}
