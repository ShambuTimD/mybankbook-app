<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Booking extends Model implements HasMedia
{
    use SoftDeletes, InteractsWithMedia;

    protected $table = 'timd_hpbms_booking_master';

    protected $guarded = [];

    // Tell Eloquent your column names
    public const CREATED_AT = 'created_on';

    public const UPDATED_AT = 'updated_on';

    public const DELETED_AT = 'deleted_on';

    protected $dates = ['created_on', 'updated_on', 'deleted_on'];

    protected $casts = [
        'pref_appointment_date' => 'date',
        'total_employees' => 'integer',
        'total_dependents' => 'integer',
        'is_hold'               => 'boolean',   // 👈 real DB column

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

    public function createdBy()
    {
        return $this->belongsTo(CompanyUser::class, 'created_by');
    }

    public function details()
    {
        return $this->hasMany(BookingDetail::class, 'booking_id')
            ->with('media'); // ✅ ensures media table data loads with each detail
    }

    public function scopeForCompany($q, $companyId)
    {
        return $q->where('company_id', $companyId);
    }


    // ⭐ Relation to Media Table for bill_media_id
    public function billMedia()
    {
        return $this->belongsTo(Media::class, 'bill_media_id');
    }

    public function statusUpdatedBy()
    {
        return $this->belongsTo(User::class, 'status_updated_by');
    }
}
