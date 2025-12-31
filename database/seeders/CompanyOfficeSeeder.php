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

        // Offices for TimD
        CompanyOffice::create([
            'company_id'                    => $company1->id,
            'office_name'                   => 'TimD - Newtown',
            'address_line_1'                => '123 Main St',
            'address_line_2'                => 'Sector 5, Salt Lake',
            'city'                          => 'Kolkata',
            'state'                         => 'West Bengal',
            'country'                       => 'India',
            'pincode'                       => '700091',
            'allowed_collection_mode'       => 'at_clinic',
            'status'                        => 'active',
            'created_by'                    => 1,
            'created_on'                    => Carbon::now(),
        ]);

        CompanyOffice::create([
            'company_id'                    => $company1->id,
            'office_name'                   => 'TimD - Chandannagar',
            'address_line_1'                => '456 Branch Ave',
            'address_line_2'                => 'Lower Parel',
            'city'                          => 'Kolkata',
            'state'                         => 'Maharashtra',
            'country'                       => 'India',
            'pincode'                       => '400001',
            'allowed_collection_mode'       => 'at_home,at_clinic',
            'status'                        => 'active',
            'created_by'                    => 1,
            'created_on'                    => Carbon::now(),
        ]);

        CompanyOffice::create([
            'company_id'                    => $company1->id,
            'office_name'                   => 'TimD - Uttar Panchanan',
            'address_line_1'                => '456 Branch Ave',
            'address_line_2'                => 'Lower Parel',
            'city'                          => 'Mumbai',
            'state'                         => 'Maharashtra',
            'country'                       => 'India',
            'pincode'                       => '400001',
            'allowed_collection_mode'       => 'at_home,at_clinic',
            'status'                        => 'active',
            'created_by'                    => 1,
            'created_on'                    => Carbon::now(),
        ]);
    }
}
