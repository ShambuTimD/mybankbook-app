<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use App\Models\Company;
use App\Models\CompanyOffice;
use App\Models\User;
use App\Models\Emp;
use App\Models\EmpDependent;

class BookingExport implements FromArray, WithHeadings, WithStyles
{
    protected $booking;

    public function __construct($booking)
    {
        $this->booking = $booking;
    }

    public function headings(): array
    {
        return [
            'company_id', 'company_name', 'office_id', 'office_name',
            'company_user_id', 'submitted_by_name', 'submitted_by_email',
            'booking_mode', 'pref_appointment_date', 'notes', 'brn',
            'user_agent', 'user_ip', 'client_session_id', 'status', 'dos',
            'emp_index', 'emp_name', 'emp_email', 'emp_phone', 'emp_gender', 'emp_dob', 'emp_designation', 'emp_medical_conditions', 'emp_remarks',
            'dep_emp_index', 'dep_employee_name', 'dep_index', 'dep_name', 'dep_emp_relation', 'dep_gender', 'dep_age', 'dep_email', 'dep_phone', 'dep_medical_conditions', 'dep_remarks',
            'submitted_booking_id', 'submitted_ref_no_BRN', 'submitted_company_id', 'submitted_company_name', 'submitted_office_id', 'submitted_office_name',
            'submitted_submitted_by_id', 'submitted_submitted_by_name', 'submitted_submitted_by_email', 'submitted_booking_mode', 'submitted_pref_appointment_date', 'submitted_notes', 'submitted_booking_status', 'submitted_total_applicants', 'submitted_integration', 'submitted_status',
            'submitted_employee_id', 'submitted_employee_name', 'submitted_employee_email', 'submitted_employee_phone', 'submitted_employee_status',
            'submitted_dep_employee_id', 'submitted_dep_employee_name', 'submitted_dep_dependent_id', 'submitted_dep_name', 'submitted_dep_relation', 'submitted_dep_email', 'submitted_dep_phone', 'submitted_dep_status'
        ];
    }

    public function array(): array
    {
        $data = [];

        // Fetch company and office details
        $companyName = optional(Company::find($this->booking->company_id))->name ?? '';
        $office = CompanyOffice::find($this->booking->office_id);
        $officeName = $office->office_name ?? $office->name ?? '';
        $submittedBy = optional(User::find($this->booking->created_by));

        // ===========================
        // Combine all data into a single array
        // ===========================

        // Draft Header
        $data[] = [
            $this->booking->company_id ?? '',
            $companyName,
            $this->booking->office_id ?? '',
            $officeName,
            $this->booking->company_user_id ?? '',
            $submittedBy->name ?? '',
            $submittedBy->email ?? '',
            $this->booking->booking_mode ?? 'online',
            $this->booking->pref_appointment_date ?? '',
            $this->booking->notes ?? '',
            $this->booking->brn ?? '',
            $this->booking->user_agent ?? '',
            $this->booking->user_ip ?? '',
            $this->booking->client_session_id ?? '',
            $this->booking->booking_status ?? $this->booking->status ?? '',
            (string)($this->booking->dos ?? $this->booking->created_on ?? $this->booking->created_at ?? ''),
        ];

        // Draft Employees
        $draftEmployees = Emp::where('booking_id', $this->booking->id)->get();
        foreach ($draftEmployees as $emp) {
            $data[] = [
                $emp->emp_index,
                $emp->name,
                $emp->email,
                $emp->phone,
                $emp->gender,
                $emp->dob,
                $emp->designation,
                $emp->medical_conditions,
                $emp->remarks,
                '', '', '', '', '', '', '', '', '', '' // Placeholder for dependents and submitted employees
            ];
        }

        // Draft Dependents
        $draftDependents = EmpDependent::where('booking_id', $this->booking->id)->get();
        foreach ($draftDependents as $dep) {
            $data[] = [
                '', '', '', '', '', '', '', '', '', '', // Placeholder for employee data
                $dep->emp_index,
                $dep->employee_name,
                $dep->dep_index,
                $dep->name,
                $dep->emp_relation,
                $dep->gender,
                $dep->age,
                $dep->email,
                $dep->phone,
                $dep->medical_conditions,
                $dep->remarks
            ];
        }

        // Submitted Header (just once for the booking)
        $data[] = [
            $this->booking->booking_id ?? '',
            $this->booking->ref_no_BRN ?? '',
            $this->booking->company_id ?? '',
            $companyName,
            $this->booking->office_id ?? '',
            $officeName,
            $submittedBy->id ?? '',
            $submittedBy->name ?? '',
            $submittedBy->email ?? '',
            $this->booking->booking_mode ?? '',
            $this->booking->pref_appointment_date ?? '',
            $this->booking->notes ?? '',
            $this->booking->booking_status ?? '',
            $this->booking->total_applicants ?? '',
            $this->booking->integration ?? '',
            $this->booking->status ?? '',
        ];

        // Submitted Employees
        $submittedEmployees = Emp::where('booking_id', $this->booking->id)->get();
        foreach ($submittedEmployees as $emp) {
            $data[] = [
                '', '', '', '', '', '', '', '', '', '', // Placeholder for draft data
                $emp->employee_id,
                $emp->name,
                $emp->email,
                $emp->phone,
                $emp->status
            ];
        }

        // Submitted Dependents
        $submittedDependents = EmpDependent::where('booking_id', $this->booking->id)->get();
        foreach ($submittedDependents as $dep) {
            $data[] = [
                '', '', '', '', '', '', '', '', '', '', // Placeholder for employee data
                '', '', '', '', '', '', '', '', '', '',
                $dep->employee_id,
                $dep->employee_name,
                $dep->dependent_id,
                $dep->name,
                $dep->relation,
                $dep->email,
                $dep->phone,
                $dep->status
            ];
        }

        return $data;
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
