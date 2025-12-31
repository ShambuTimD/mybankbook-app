<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BookingDetail extends Model
{
    use SoftDeletes;

    protected $table = 'timd_hpbms_companies_booking_details';
    protected $guarded = [];

    public const CREATED_AT = 'created_on';
    public const UPDATED_AT = 'updated_on';
    public const DELETED_AT = 'deleted_on';

    protected $dates = ['created_on', 'updated_on', 'deleted_on', 'dob'];

    protected $casts = [
        'dob' => 'date',
        'age' => 'integer',
        'medical_conditions' => 'array',
    ];

    // -------- Relations --------
    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id', 'id');
    }

    public function employee()
    {
        // ✅ use Emp model and the correct FK
        return $this->belongsTo(Emp::class, 'emp_id', 'id');
    }

    public function dependent()
    {
        // ✅ use EmpDependent model and the correct FK
        return $this->belongsTo(EmpDependent::class, 'dependent_id', 'id');
    }
}
