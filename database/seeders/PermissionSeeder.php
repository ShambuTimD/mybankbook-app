<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Route;
use App\Models\Role;
use App\Models\Permission;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure routes are loaded before fetching
        app()->make('router')->getRoutes();

        // Get Super Admin role
        $superAdmin = Role::where('role_name', 'super_admin')->first();

        if (!$superAdmin) {
            $this->command->error("❌ Super Admin role not found. Please create it first.");
            return;
        }

        // Collect all route names
        $routeNames = collect(Route::getRoutes())
            ->map(fn($route) => $route->getName())
            ->filter() // remove nulls
            ->unique()
            ->values();

        if ($routeNames->isEmpty()) {
            $this->command->error("❌ No routes found. Please check your routes.");
            return;
        }

        $this->command->info("Found " . $routeNames->count() . " named routes.");

        foreach ($routeNames as $routeName) {
            Permission::firstOrCreate(
                [
                    'role_id' => $superAdmin->id,
                    'name'    => $routeName,
                ],
                [
                    'created_by' => 1, // you can change to seeder admin user ID
                ]
            );
        }

        $this->command->info("✅ All route permissions inserted. Super Admin now has full access.");
    }
}
