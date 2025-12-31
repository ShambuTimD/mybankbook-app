<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UserRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Assign roles (1, 2, 3) to users (1, 2, 3)
        $userroles = [
            ['user_id' => 1, 'role_id' => 2, 'is_active' => 1, 'created_at' => Carbon::now(), 'updated_at' => Carbon::now()],

        ];

        DB::table('user_roles')->insert($userroles);
    }
}
