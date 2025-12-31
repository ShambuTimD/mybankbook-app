<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class ApplicantSegementSettings extends Settings
{

    public string $app_segement_emp = 'Total enrolled employees under the corporate health program.';
    public string $app_segement_dep = 'Total enrolled dependent members.';
    public string $app_segement_total_enrolled = 'Total applicants enrolled and eligible.';
    
    public static function group(): string
    {
        return 'applicant_segment';
    }
}
