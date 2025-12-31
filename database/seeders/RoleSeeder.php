<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['role_name' => 'admin', 'role_title' => 'Admin', 'is_active' => 1, 'role_for' => 'backend'],
            ['role_name' => 'super_admin', 'role_title' => 'Super Admin', 'is_active' => 1, 'role_for' => 'backend'],
            ['role_name' => 'customer', 'role_title' => 'Customer', 'is_active' => 1, 'role_for' => 'frontend'],
            ['role_name' => 'company_admin', 'role_title' => 'Company Admin', 'is_active' => 1, 'role_for' => 'frontend'],
            ['role_name' => 'company_executive', 'role_title' => 'Company Executive', 'is_active' => 1, 'role_for' => 'frontend'],
            // ['role_name' => 'company_executive_manager', 'role_title' => 'Company Executive Manager', 'is_active' => 1, 'role_for' => 'frontend'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['role_name' => $role['role_name']], // match on the correct column
                $role
            );
        }
    }
}
