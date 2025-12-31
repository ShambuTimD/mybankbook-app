<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Customers extends Model
{
    use SoftDeletes, HasApiTokens, Notifiable;
    protected $table = 'customers';

    protected $fillable = [
        'first_name',
        'last_name',
        'email_id',
        'phone_number',
        'passcode',
        'password',
        'gender',
        'dob',
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
