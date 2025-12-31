<?php

namespace App\Exports;

use App\Models\Booking;
use App\Models\BookingDetail;
use App\Models\Company;
use App\Models\CompanyOffice;
use App\Models\CompanyUser;
use App\Models\Emp;
use App\Models\EmpDependent;
use Carbon\Carbon;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;

class BookingExport implements FromView, ShouldAutoSize, WithEvents
{
    /** @var \App\Models\Booking */
    protected $booking;

    protected $applicants;

    protected int $masterRows = 0;
    protected int $detailsHeaderRow = 0;

    public function __construct(Booking $booking, $applicants = null)
    {
        $this->booking    = $booking;
        $this->applicants = $applicants;

        Log::info('BookingExport initialized', ['booking_id' => $this->booking->id ?? null]);
    }

    public function view(): View
    {
        $companyName = optional(Company::find($this->booking->company_id))->name ?? '';
        $office      = CompanyOffice::find($this->booking->office_id);
        $officeName  = $office->office_name ?? $office->name ?? '';
        $submittedBy = optional(CompanyUser::find($this->booking->created_by));

        $master = [
            ['Field' => 'Booking ID',            'Value' => $this->booking->id],
            ['Field' => 'BRN',                   'Value' => $this->booking->brn ?? ''],
            ['Field' => 'Company ID',            'Value' => $this->booking->company_id],
            ['Field' => 'Company Name',          'Value' => $companyName],
            ['Field' => 'Office ID',             'Value' => $this->booking->office_id],
            ['Field' => 'Office Address',        'Value' => $this->booking->office_address],
            ['Field' => 'Office Name',           'Value' => $officeName],
            ['Field' => 'Submitted By Name',     'Value' => $submittedBy->name ?? ''],
            ['Field' => 'Submitted By Email',    'Value' => $submittedBy->email ?? ''],
            ['Field' => 'Submitted By Phone No', 'Value' => $submittedBy->phone ?? ''],
            ['Field' => 'Booking Mode',          'Value' => $this->booking->booking_mode ?? 'Online'],
            ['Field' => 'Pref. Appt. Date',      'Value' => Carbon::parse($this->booking->pref_appointment_date)->format('F j, Y')],
            ['Field' => 'Pref. Collection Mode', 'Value' => $this->booking->preferred_collection_mode],
            ['Field' => 'Notes',                 'Value' => (string)($this->booking->notes ?? '')],
            ['Field' => 'Booking Status',        'Value' => ucfirst($this->booking->booking_status ?? $this->booking->status ?? '')],
            ['Field' => 'User Agent',            'Value' => (string)($this->booking->user_agent ?? '')],
            ['Field' => 'User IP',               'Value' => (string)($this->booking->user_ip ?? '')],
            ['Field' => 'Client Session ID',     'Value' => (string)($this->booking->client_session_id ?? '')],
            ['Field' => 'DOS / Created On',      'Value' => Carbon::parse($this->booking->created_on)->format('F j, Y g:i A')],
        ];
        $this->masterRows = count($master);

        // ---- Details directly from booking_details ----
        $detailRows = BookingDetail::where('booking_id', $this->booking->id)
            ->orderByRaw("FIELD(applicant_type,'employee','dependent')")
            ->orderBy('id')
            ->get();

        $details = $detailRows->map(function ($d) {
            // Try to fetch parent employee detail
            $employee = null;
            if ($d->applicant_type === 'dependent' && $d->emp_id) {
                $employee = BookingDetail::where('booking_id', $d->booking_id)
                    ->where('applicant_type', 'employee')
                    ->where('emp_id', $d->emp_id)
                    ->first();
            }

            return [
                'BOOKING ID'            => $d->booking_id ?? 'N/A',
                'BRN'                   => $d->brn ?? 'N/A',
                'Applicant Type'        => $d->applicant_type ?? 'N/A',
                'UARN'                  => $d->uarn ?? 'N/A',
                'Employee ID'           => $d->emp_id ?? 'N/A',
                'Employee Code'         => $d->employee_code ?? 'N/A',

                // ✅ If dependent, pull employee name/age from linked employee
                'Employee Name'         => $d->applicant_type === 'employee'
                                                ? ($d->full_name ?? 'N/A')
                                                : ($employee->full_name ?? 'N/A'),

                'Employee Age'          => $d->applicant_type === 'employee' ? ($d->age ?? '') : 'N/A',
                'Dependent ID'          => $d->dependent_id ?? 'N/A',
                'Dependent Name'        => $d->applicant_type === 'dependent' ? $d->full_name : 'N/A',
                'Dependent Age'         => $d->applicant_type === 'dependent' ? ($d->age ?? '') : 'N/A',
                'Gender'                => $d->gender ?? 'N/A',
                'Medical Conditions'    => $d->medical_conditions ?? 'N/A',
                'Phone'                 => $d->phone ?? 'N/A',
                'Email'                 => $d->email ?? 'N/A',
                'Designation'           => $d->designation ?? 'N/A',
                'Home Address'          => $d->home_address ?? 'N/A',
                'Relation'              => $d->emp_relation ?? 'N/A',
                'Remarks'               => $d->remarks ?? 'N/A',
            ];
        })->toArray();


        $this->detailsHeaderRow = 1 + $this->masterRows + 2 + 1;

        return view('exports.booking', [
            'master'  => $master,
            'details' => $details,
        ]);
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                try {
                    $sheet->getStyle("A{$this->detailsHeaderRow}:Z{$this->detailsHeaderRow}")
                        ->getFont()->setBold(true);
                } catch (\Throwable $e) {
                    Log::warning('AfterSheet styling warning', ['msg' => $e->getMessage()]);
                }
            },
        ];
    }
}
