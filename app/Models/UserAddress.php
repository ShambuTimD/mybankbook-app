<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserAddress extends Model
{
    use SoftDeletes;

    protected $table = 'user_addresses';

    protected $fillable = [
        'user_id',
        'address_1',
        'address_2',
        'state',
        'district',
        'postal_code',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
