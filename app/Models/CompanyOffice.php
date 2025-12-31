<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanyOffice extends Model
{
    protected $table = 'timd_hpbms_comp_offices'; // custom table name

    protected $fillable = [
        'company_id',
        'office_name',
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'country',
        'pincode',
        'allowed_collection_mode',
        'status',
        'created_by',
        'created_on',
        'updated_by',
        'updated_on',
        'deleted_by',
        'deleted_on',
    ];

    public $timestamps = false; // custom timestamp columns, not created_at/updated_at

    protected $casts = [
        'created_on' => 'datetime',
        'updated_on' => 'datetime',
        'deleted_on' => 'datetime',
    ];

    // Relationships
    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }
}
