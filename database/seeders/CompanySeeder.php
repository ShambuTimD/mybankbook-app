<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Company;
use Carbon\Carbon;

class CompanySeeder extends Seeder
{
    public function run(): void
    {
       Company::create([
            'name'              => 'KORPHEAL SERVICES LLP',
            'short_name'        => 'KORPH',
            'email'             => 'info@korpheal.com',
            'phone'             => '9998877665',
            'alternate_phone'   => '9988776655',
            'gst_number'        => '27BBBBB1111B2Z6',
            'pan_number'        => 'BBBBB1111B',
            'industry_type'     => 'Healthcare',
            'company_size'      => '100-250',
            'registration_type' => 'LLP',
            'address_line_1'    => 'Tollygunge',
            'address_line_2'    => 'Kolkata',
            'city'              => 'Kolkata',
            'state'             => 'West Bengal',
            'country'           => 'India',
            'pincode'           => '400059',
            'website'           => 'https://www.healthpulse.com',
            'logo'              => null,
            'status'            => 'active',
            'created_by'        => 1,
            'created_on'        => Carbon::now(),
            'updated_by'        => null,
            'updated_on'        => null,
            'deleted_by'        => null,
        ]);
        
        Company::create([
            'name'              => 'Tim Digital',
            'short_name'        => 'TimD',
            'email'             => 'hr@timdigital.com',
            'phone'             => '9998877665',
            'alternate_phone'   => '9988776655',
            'gst_number'        => '27BBBBB1111B2Z6',
            'pan_number'        => 'BBBBB1111B',
            'industry_type'     => 'Healthcare',
            'company_size'      => '100-250',
            'registration_type' => 'Private Limited',
            'address_line_1'    => 'Green Avenue, Tower B',
            'address_line_2'    => 'Andheri East',
            'city'              => 'Mumbai',
            'state'             => 'Maharashtra',
            'country'           => 'India',
            'pincode'           => '400059',
            'website'           => 'https://www.healthpulse.com',
            'logo'              => null,
            'status'            => 'active',
            'created_by'        => 1,
            'created_on'        => Carbon::now(),
            'updated_by'        => null,
            'updated_on'        => null,
            'deleted_by'        => null,
        ]);

        
    }
}
