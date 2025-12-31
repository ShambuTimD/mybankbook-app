<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Catalogs extends Model
{
    protected $table = 'catalogs';

    protected $fillable = [
        'name',
        'description',
        'image',
        'status',
        'created_by',
        'updated_by',
        'deleted_by',
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
