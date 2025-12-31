<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class BookingReportItem extends Model
{
    protected $table = "timd_booking_report_items";
    protected $fillable = [
        'booking_detail_id',
        'category_id',
        'test_id',
        'notes',
        'file_path',
        'file_name',
        'mime_type',
        'file_size',
        'media_id',
        'is_shared',
    ];

    public function bookingDetail()
    {
        return $this->belongsTo(BookingDetail::class);
    }

    public function media()
    {
        return $this->belongsTo(Media::class);
    }
}
