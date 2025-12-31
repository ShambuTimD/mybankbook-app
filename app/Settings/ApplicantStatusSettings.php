<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class ApplicantStatusSettings extends Settings
{

    public string $app_status_total_applications = 'All applications including scheduled, attended, no_show, cancelled and hold.';
    public string $app_status_schedule = 'Applicants who have a scheduled appointment but haven’t visited yet.';
    public string $app_status_attended = 'Applicants who have successfully attended their scheduled appointment.';
    public string $app_status_no_show = 'Applicants who missed their scheduled appointment.';
    public string $app_status_cancelled = 'Appointments that were cancelled or placed on hold by the applicant or admin.';
    public string $app_segement_dep = 'Total enrolled dependent members.';
    public string $app_segement_total_enrolled = 'Total applicants enrolled and eligible.';

    public static function group(): string
    {
        return 'applicant_status';
    }
}
