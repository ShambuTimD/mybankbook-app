<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class BookingDetail extends Model implements HasMedia
{
    use InteractsWithMedia, SoftDeletes;

    protected $table = 'timd_hpbms_companies_booking_details';

    protected $guarded = [];

    public const CREATED_AT = 'created_on';

    public const UPDATED_AT = 'updated_on';

    public const DELETED_AT = 'deleted_on';

    protected $dates = [
        'created_on',
        'updated_on',
        'deleted_on',
        'dob',
        'status_updated_on',
        'report_uploaded_on',
        'bill_uploaded_on',
    ];

    protected $casts = [
        'dob' => 'date',
        'age' => 'integer',
        'medical_conditions' => 'array',
        'report_media_json' => 'array',
    ];

    protected $appends = ['bill_url', 'report_url'];

    /*--------------------------------------------
    | ENUM CONSTANTS (FINAL STATUS MODEL)
    ---------------------------------------------*/

    // Booking + Application Status
    const STATUS_SCHEDULED = 'scheduled';

    const STATUS_ATTENDED = 'attended';

    const STATUS_NO_SHOW = 'no_show';

    const STATUS_CANCELLED = 'cancelled';

    // Report Status
    const REPORT_PROCESSING = 'processing';

    const REPORT_IN_QC = 'in_qc';

    const REPORT_UPLOADED = 'report_uploaded';

    const REPORT_PARTIALLY_UPLOADED = 'report_partially_uploaded';

    const REPORT_SHARED = 'report_shared';

    const REPORT_CANCELLED = 'cancelled';

    /*--------------------------------------------
    | Relationships
    ---------------------------------------------*/

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    public function employee()
    {
        return $this->belongsTo(Emp::class, 'emp_id');
    }

    public function dependent()
    {
        return $this->belongsTo(EmpDependent::class, 'dependent_id');
    }

    // Who updated the status
    public function statusUpdatedBy()
    {
        return $this->belongsTo(User::class, 'status_updated_by');
    }

    // Who uploaded the report
    public function reportUploadedBy()
    {
        return $this->belongsTo(User::class, 'report_uploaded_by');
    }

    public function reportItems()
    {
        return $this->hasMany(BookingReportItem::class, 'booking_detail_id');
    }


    /*--------------------------------------------
    | Media Collections
    ---------------------------------------------*/
    public function registerMediaCollections(): void
    {
        $this
            ->addMediaCollection('bills')
            ->useDisk('uploads')
            ->singleFile();

        $this
            ->addMediaCollection('reports')
            ->useDisk('uploads')
            ->singleFile();
    }

    /*--------------------------------------------
    | Accessors
    ---------------------------------------------*/
    public function getBillUrlAttribute()
    {
        return $this->getFirstMediaUrl('bills');
    }

    public function getReportUrlAttribute()
    {
        return $this->getFirstMediaUrl('reports');
    }

    /*--------------------------------------------
    | STATUS UPDATE LOGIC (Helpful Shortcut)
    ---------------------------------------------*/
    public function updateStatus($newStatus, $reason = null, $updatedBy = null)
    {
        $this->status = $newStatus;
        $this->status_reason_code = $reason;
        $this->status_updated_by = $updatedBy ?? auth()->id();
        $this->status_updated_on = now();

        return $this->save();
    }

    public function updateReportStatus($newStatus, $remarks = null, $updatedBy = null)
    {
        $this->report_status = $newStatus;
        $this->report_remarks = $remarks;
        $this->report_uploaded_by = $updatedBy ?? auth()->id();
        $this->report_uploaded_on = now();

        return $this->save();
    }

    /*--------------------------------------------
    | Query Scopes
    ---------------------------------------------*/

    public function scopeActive($q)
    {
        return $q->whereNull('deleted_on');
    }

    public function scopeAttended($q)
    {
        return $q->where('status', self::STATUS_ATTENDED);
    }

    public function scopeScheduled($q)
    {
        return $q->where('status', self::STATUS_SCHEDULED);
    }

    public function scopeReportShared($q)
    {
        return $q->where('report_status', self::REPORT_SHARED);
    }
}
