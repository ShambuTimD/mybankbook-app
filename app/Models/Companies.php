<?php

namespace App\Models;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

use Illuminate\Database\Eloquent\Model;

class Companies extends Model
{
    use SoftDeletes;

    protected $table = 'companies';

    protected $fillable = [
        'company_name',
        'brand_title',
        'company_address',
        'logo',
        'status',
    ];

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function deletedBy()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }
}
