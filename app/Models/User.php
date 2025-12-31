<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;


class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, \Laravel\Sanctum\HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'google2fa_secret',
        'two_factor_confirmed',
        'type',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'google2fa_secret' => 'encrypted',
            'two_factor_confirmed' => 'boolean',

        ];
    }
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles', 'user_id', 'role_id');
    }

    public function backendroles()
    {
        return $this->belongsToMany(Role::class, 'user_roles', 'user_id', 'role_id')
            ->where('role_for', 'backend');
    }

    public function address()
    {
        return $this->hasOne(UserAddress::class);
    }

    public function allPermissions()
    {
        return $this->backendroles()
            ->with(['permissions' => function ($q) {
                $q->where('is_active', 1);
            }])
            ->get(['roles.id', 'roles.role_name', 'roles.role_title', 'roles.role_for'])
            ->pluck('permissions')      // Collection<Collection<Permission>>
            ->flatten()                 // Collection<Permission>
            ->pluck('name')             // Collection<string>
            ->unique()
            ->values();                 // clean 0..N indexing
    }
}
