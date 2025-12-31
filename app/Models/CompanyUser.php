<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class CompanyUser extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'timd_hpbms_comp_users';

    protected $fillable = [
        'company_id',
        'company_office_id', // stores comma separated office IDs
        'is_primary',
        'is_tester',
        'name',
        'email',
        'password',
        'phone',
        'role_id',
        'designation',
        'last_login_at',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $dates = [
        'created_on',
        'updated_on',
        'deleted_on',
        'last_login_at'
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'is_tester'  => 'boolean',
    ];

    public $timestamps = false; // using created_on / updated_on instead

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id', 'id');
    }

    /*
    |--------------------------------------------------------------------------
    | Office Handling (comma separated IDs)
    |--------------------------------------------------------------------------
    */

    // Accessor: DB string → array
    // This allows us to work with company_office_id as an array in the model
    public function getCompanyOfficeIdAttribute($value)
    {
        if (!$value) {
            return [];
        }

        // If value is already numeric (single office), wrap in array
        if (is_numeric($value)) {
            return [(int) $value];
        }

        // Split comma-separated values into array
        return collect(explode(',', $value))
            ->map(fn($id) => (int) trim($id))
            ->filter()
            ->values()
            ->toArray();
    }


    // Mutator: array → DB string
    public function setCompanyOfficeIdAttribute($value)
    {
        if (is_array($value)) {
            $this->attributes['company_office_id'] = implode(',', $value);
        } else {
            $this->attributes['company_office_id'] = $value;
        }
    }

    // Helper: fetch actual office models
    public function offices()
    {
        return CompanyOffice::whereIn('id', $this->company_office_id)->get();
    }

    // Helper: get office names as string
    public function getOfficeNamesAttribute()
    {
        return $this->offices()->pluck('office_name')->implode(', ');
    }

    // public function office()
    // {
    //     return $this->belongsTo(CompanyOffice::class, 'company_office_id', 'id');
    // }
}
