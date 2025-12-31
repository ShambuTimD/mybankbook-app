<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        $this->call(SettingsSeeder::class);
        $this->call(RoleSeeder::class);
        $this->call(CompanySeeder::class);
        $this->call(CompanyOfficeSeeder::class);
        $this->call(CompanyUserSeeder::class);

        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admmin@timdtech.com',
            'password' => bcrypt('password'), // password
            'type' => 'backend',
            'is_active' => true,
        ]);
    }
}
