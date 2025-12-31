<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TestCategorySeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('test_categories')->insert([
            ['name' => 'Pathology',   'slug' => 'pathology',   'status' => 'active', 'created_by' => 1, 'updated_by' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Radiology',   'slug' => 'radiology',   'status' => 'active', 'created_by' => 1, 'updated_by' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Cardiac',     'slug' => 'cardiac',     'status' => 'active', 'created_by' => 1, 'updated_by' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Physical',    'slug' => 'physical',    'status' => 'active', 'created_by' => 1, 'updated_by' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Wellness',    'slug' => 'wellness',    'status' => 'active', 'created_by' => 1, 'updated_by' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Dental',      'slug' => 'dental',      'status' => 'active', 'created_by' => 1, 'updated_by' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Vision',      'slug' => 'vision',      'status' => 'active', 'created_by' => 1, 'updated_by' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Vaccination', 'slug' => 'vaccination', 'status' => 'active', 'created_by' => 1, 'updated_by' => 1, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }
}
