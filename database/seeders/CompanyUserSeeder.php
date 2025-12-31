<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CompanyUser;
use App\Models\Company;
use App\Models\CompanyOffice;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class CompanyUserSeeder extends Seeder
{
    public function run(): void
    {
        $company1 = Company::where('name', 'Tim Digital')->first();

        $office1 = CompanyOffice::where('office_name', 'TimD - Newtown')->first();
        $office2 = CompanyOffice::where('office_name', 'TimD - Chandannagar')->first();
        $office5 = CompanyOffice::where('office_name', 'TimD - Uttar Panchanan')->first();

        // User 1 → only office1
        CompanyUser::create([
            'company_id'        => $company1->id,
            'company_office_id' => $office1->id,
            'is_primary'        => 1,
            'is_tester'         => 1,
            'name'              => 'Sudip Kumar',
            'email'             => 'sudipkumar.official@gmail.com',
            'password'          => Hash::make('sudipkumar.official123'),
            'phone'             => '9876543210',
            'role_id'           => 4,
            'designation'       => 'Admin',
            'status'            => 'active',
            'created_by'        => 1,
            'created_on'        => Carbon::now(),
        ]);

        // User 2 → only office2
        CompanyUser::create([
            'company_id'        => $company1->id,
            'company_office_id' => $office2->id,
            'is_primary'        => 1,
            'is_tester'         => 0,
            'name'              => 'Suman Saha',
            'email'             => 'suman2.timd@gmail.com',
            'password'          => Hash::make('suman2.timd123'),
            'phone'             => '9988745562',
            'role_id'           => 5,
            'designation'       => 'Tester',
            'status'            => 'active',
            'created_by'        => 1,
            'created_on'        => Carbon::now(),
        ]);

        // User 3 → multiple offices (office1, office5)
        CompanyUser::create([
            'company_id'        => $company1->id,
            'company_office_id' => $office1->id . ',' . $office5->id, // comma-separated
            'is_primary'        => 1,
            'is_tester'         => 1,
            'name'              => 'Shambu Nath Singh',
            'email'             => 'shambun.timd@gmail.com',
            'password'          => Hash::make('shambun.timd123'),
            'phone'             => '9988745569',
            'role_id'           => 5,
            'designation'       => 'Tester',
            'status'            => 'active',
            'created_by'        => 1,
            'created_on'        => Carbon::now(),
        ]);
    }
}
