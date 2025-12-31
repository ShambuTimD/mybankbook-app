<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Booking extends Model
{
    use SoftDeletes;

    protected $table = 'timd_hpbms_booking_master';
    protected $guarded = [];

    // Tell Eloquent your column names
    public const CREATED_AT = 'created_on';
    public const UPDATED_AT = 'updated_on';
    public const DELETED_AT = 'deleted_on';

    protected $dates = ['created_on', 'updated_on', 'deleted_on'];

    protected $casts = [
        'pref_appointment_date' => 'date',
        'total_employees'       => 'integer',
        'total_dependents'      => 'integer',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function office()
    {
        return $this->belongsTo(CompanyOffice::class, 'office_id');
    }

    public function requestedBy()
    {
        return $this->belongsTo(CompanyUser::class, 'company_user_id');
    }

    public function details()
    {
        return $this->hasMany(BookingDetail::class, 'booking_id');
    }

    public function scopeForCompany($q, $companyId)
    {
        return $q->where('company_id', $companyId);
    }
}
