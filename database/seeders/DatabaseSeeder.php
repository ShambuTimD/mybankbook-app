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
            'email' => 'sa@timdtech.com',
            'password' => bcrypt('Sa@timdtech.com123'), // password
            'type' => 'backend',
            'is_active' => true,
        ]);

        $this->call(UserRoleSeeder::class);
        $this->call(PermissionSeeder::class);
        $this->call(FAQSeeder::class);
        $this->call(TestCategorySeeder::class);
        $this->call(TestSeeder::class);

        $this->call(SubscriptionPlanSeeder::class);
        $this->call(SubscriptionPlanFeatureSeeder::class);
        // $this->call(DemoUserSubscriptionSeeder::class);

    }
}
