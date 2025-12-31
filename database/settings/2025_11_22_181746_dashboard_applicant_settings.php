<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('applicant_segment.app_segement_emp', 'Total enrolled employees under the corporate health program.');
        $this->migrator->add('applicant_segment.app_segement_dep', 'Total enrolled dependent members.');
        $this->migrator->add('applicant_segment.app_segement_total_enrolled', 'Total applicants enrolled and eligible.');

        $this->migrator->add('applicant_status.app_status_total_applications', 'All applications including scheduled, attended, no_show, cancelled and hold.');
        $this->migrator->add('applicant_status.app_status_schedule', 'Applicants who have a scheduled appointment but haven’t visited yet.');
        $this->migrator->add('applicant_status.app_status_attended', 'Applicants who have successfully attended their scheduled appointment.');
        $this->migrator->add('applicant_status.app_status_no_show', 'Applicants who missed their scheduled appointment.');
        $this->migrator->add('applicant_status.app_status_cancelled', 'Appointments that were cancelled or placed on hold by the applicant or admin.');
        $this->migrator->add('applicant_status.app_segement_dep', 'Total enrolled dependent members.');
        $this->migrator->add('applicant_status.app_segement_total_enrolled', 'Total applicants enrolled and eligible.');

        $this->migrator->add('report_status.app_report_total_reports', 'Reports generated for all attended applicants.');
        $this->migrator->add('report_status.app_report_processing', 'Reports currently being processed and prepared.');
        $this->migrator->add('report_status.app_report_in_qc', 'Reports undergoing Quality Control review before sharing.');
        $this->migrator->add('report_status.app_report_report_shared', 'Reports that have been finalized and shared with the applicant/client.');

        $this->migrator->add('dashboard_metrics.dashboard_metrics_attendance_rate', 'Percentage of enrolled members who attended their appointment (Attended / Total Enrolled).');
        $this->migrator->add('dashboard_metrics.dashboard_metrics_total_enrolled', 'Total eligible members (Employees + Dependents).');
        $this->migrator->add('dashboard_metrics.dashboard_metrics_total_attended', 'Total number of members who visited and completed their appointment.');
        $this->migrator->add('dashboard_metrics.dashboard_metrics_total_dropped', 'Total applicants who did not attend (No Show + Cancelled/Hold).');
    }
};
