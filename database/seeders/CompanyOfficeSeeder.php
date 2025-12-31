<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Company;
use App\Models\CompanyOffice;
use Carbon\Carbon;

class CompanyOfficeSeeder extends Seeder
{
    public function run(): void
    {
        // Get companies by name
        $company1 = Company::where('name', 'Tim Digital')->first();
        $company2 = Company::where('name', 'KORPHEAL SERVICES LLP')->first();

        // Offices for TimD
        CompanyOffice::create([
            'company_id'     => $company1->id,
            'office_name'    => 'TimD - Newtown',
            'address_line_1' => '123 Main St',
            'address_line_2' => 'Sector 5, Salt Lake',
            'city'           => 'Kolkata',
            'state'          => 'West Bengal',
            'country'        => 'India',
            'pincode'        => '700091',
            'status'         => 'active',
            'created_by'     => 1,
            'created_on'     => Carbon::now(),
        ]);

        CompanyOffice::create([
            'company_id'     => $company1->id,
            'office_name'    => 'TimD - Chandannagar',
            'address_line_1' => '456 Branch Ave',
            'address_line_2' => 'Lower Parel',
            'city'           => 'Kolkata',
            'state'          => 'Maharashtra',
            'country'        => 'India',
            'pincode'        => '400001',
            'status'         => 'active',
            'created_by'     => 1,
            'created_on'     => Carbon::now(),
        ]);

        CompanyOffice::create([
            'company_id'     => $company1->id,
            'office_name'    => 'TimD - Uttar Panchanan',
            'address_line_1' => '456 Branch Ave',
            'address_line_2' => 'Lower Parel',
            'city'           => 'Mumbai',
            'state'          => 'Maharashtra',
            'country'        => 'India',
            'pincode'        => '400001',
            'status'         => 'active',
            'created_by'     => 1,
            'created_on'     => Carbon::now(),
        ]);

        // Offices for TimDigital
        CompanyOffice::create([
            'company_id'     => $company2->id,
            'office_name'    => 'KORPHEAL - Tollygunge',
            'address_line_1' => '789 Tech Lane',
            'address_line_2' => 'Cyber City',
            'city'           => 'Kolkata',
            'state'          => 'West Bengal',
            'country'        => 'India',
            'pincode'        => '110001',
            'status'         => 'active',
            'created_by'     => 1,
            'created_on'     => Carbon::now(),
        ]);

        CompanyOffice::create([
            'company_id'     => $company2->id,
            'office_name'    => 'KORPHEAL - Bosepukur',
            'address_line_1' => '101 Design St',
            'address_line_2' => 'Electronic City',
            'city'           => 'Kolkata',
            'state'          => 'West Bengal',
            'country'        => 'India',
            'pincode'        => '560100',
            'status'         => 'active',
            'created_by'     => 1,
            'created_on'     => Carbon::now(),
        ]);

    }
}
