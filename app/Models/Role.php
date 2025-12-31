<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Role extends Model
{
    use HasFactory , SoftDeletes ;
    protected $fillable=[
        'type',
        'name',
        'role_for',
        'created_at',
        'updated_at'
    ];

    public function permissions(){
        return $this->hasMany(Permission::class,'role_id');
    }

    public function checkPermission($route_name)
    {
        $check =   Permission::where('role_id', $this->id)->where('name', $route_name)->first();
        if ($check) {
            return "checked";
        }
    }
}
