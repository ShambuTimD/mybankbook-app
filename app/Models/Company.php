<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $table = 'timd_hpbms_companies'; // custom table name
    public $timestamps = false;
    protected $fillable = [
        'name',
        'short_name',
        'email',
        'phone',
        'alternate_phone',
        'website',
        'gst_number',
        'pan_number',
        'industry_type',
        'company_size',
        'registration_type',
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'country',
        'pincode',
        'logo',
        'status',
        'created_by',
        'updated_by',
        'deleted_by'
    ];

    protected $casts = [
        'status' => 'string',
    ];
    protected $appends = ['logo_url'];

    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo ? asset('storage/'.$this->logo) : null;
    }
}
