<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_email',
        'office_location',
        'appointment_date',
        'appointment_time',
        'booking_mode',
        'csv_file',
        'agreed',
    ];

    // Relationships
    public function employees()
    {
        return $this->hasMany(Employees::class);
    }
}
