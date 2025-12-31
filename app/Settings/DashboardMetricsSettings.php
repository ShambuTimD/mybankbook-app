<?php

namespace App\Settings;

use Spatie\LaravelSettings\Settings;

class DashboardMetricsSettings extends Settings
{

    public string $dashboard_metrics_attendance_rate = 'Percentage of enrolled members who attended their appointment (Attended / Total Enrolled).';
    public string $dashboard_metrics_total_enrolled = 'Total eligible members (Employees + Dependents).';
    public string $dashboard_metrics_total_attended = 'Total number of members who visited and completed their appointment.';
    public string $dashboard_metrics_total_dropped = 'Total applicants who did not attend (No Show + Cancelled/Hold).';

    public static function group(): string
    {
        return 'dashboard_metrics';
    }
}
