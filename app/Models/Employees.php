<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Employees extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_email',
        'company_password',
        'office_location',
        'appointment_date',
        'appointment_time',
        'employee_id',
        'name',
        'designation',
        'age',
        'gender',
        'email',
        'phone',
        'conditions',
        'other_condition',
        'has_dependents',
        'agreed',
        'captcha'
    ];

    protected $casts = [
        'conditions' => 'array',
        'agreed' => 'boolean',
        'has_dependents' => 'boolean',
    ];

    public function dependents()
    {
        return $this->hasMany(Dependents::class);
    }
    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }
}
