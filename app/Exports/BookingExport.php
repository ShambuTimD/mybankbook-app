<?php

namespace App\Exports;

use App\Models\Booking;
use App\Models\BookingDetail;
use App\Models\Company;
use App\Models\CompanyOffice;
use App\Models\CompanyUser;
use App\Models\User;
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

    /** Optional payload you were building in controller; not required */
    protected $applicants;

    /** For styling / freeze panes */
    protected int $masterRows = 0;
    protected int $detailsHeaderRow = 0;

    /**
     * Accepts booking and optional applicants array.
     */
    public function __construct(Booking $booking, $applicants = null)
    {
        $this->booking    = $booking;
        $this->applicants = $applicants;

        Log::info('BookingExport initialized', ['booking_id' => $this->booking->id ?? null]);
    }

    /**
     * Build a single-sheet view:
     * - Master KV block at top
     * - Details table below
     */
    public function view(): View
    {
        $companyName = optional(Company::find($this->booking->company_id))->name ?? '';
        $office      = CompanyOffice::find($this->booking->office_id);
        $officeName  = $office->office_name ?? $office->name ?? '';
        $submittedBy = optional(CompanyUser::find($this->booking->created_by));

        // ---- Master key-value rows (top block) ----
        $master = [
            ['Field' => 'Booking ID',                       'Value' => $this->booking->id],
            ['Field' => 'BRN',                              'Value' => $this->booking->brn ?? ''],
            ['Field' => 'Company ID',                       'Value' => $this->booking->company_id],
            ['Field' => 'Company Name',                     'Value' => $companyName],
            ['Field' => 'Office ID',                        'Value' => $this->booking->office_id],
            ['Field' => 'Office Name',                      'Value' => $officeName],
            ['Field' => 'Submitted By Name',                'Value' => $submittedBy->name ?? ''],
            ['Field' => 'Submitted By Email',               'Value' => $submittedBy->email ?? ''],
            ['Field' => 'Booking Mode',                     'Value' => $this->booking->booking_mode ?? 'Online'],
            ['Field' => 'Pref. Appt. Date',                 'Value' => (string)($this->booking->pref_appointment_date ?? '')],
            ['Field' => 'Notes',                            'Value' => (string)($this->booking->notes ?? '')],
            ['Field' => 'Booking Status',                   'Value' => ucfirst($this->booking->booking_status ?? $this->booking->status ?? '')],
            ['Field' => 'User Agent',                       'Value' => (string)($this->booking->user_agent ?? '')],
            ['Field' => 'User IP',                          'Value' => (string)($this->booking->user_ip ?? '')],
            ['Field' => 'Client Session ID',                'Value' => (string)($this->booking->client_session_id ?? '')],
            ['Field' => 'DOS / Created On',                 'Value' => (string)($this->booking->dos ?? $this->booking->created_on ?? $this->booking->created_at ?? '')],
        ];

        // Make count available for AfterSheet
        $this->masterRows = count($master); // data rows only

        // ---- Details table rows (employees + dependents) ----
        // We’ll build from BookingDetail which your controller writes to.
        // Ensure BookingDetail has the relevant fields you want to export.
        $details = BookingDetail::with(['employee', 'dependent'])
            ->where('booking_id', $this->booking->id)
            ->orderByRaw("FIELD(applicant_type,'employee','dependent')")
            ->orderBy('id')
            ->get()
            ->map(function ($d) {
                // Pull what we can from detail row + relationships with safe null coalescing.
                return [
                    'Applicant Type'       => $d->applicant_type ?? '',
                    'Employee ID'          => $d->emp_id ?? '',
                    'Employee Code'        => $d->emp_code ?? optional($d->employee)->emp_code ?? '',
                    'Employee Name'        => $d->emp_name ?? optional($d->employee)->name ?? '',
                    'Dependent ID'         => $d->dependent_id ?? '',
                    'Dependent Name'       => $d->dep_name ?? optional($d->dependent)->name ?? '',
                    'Relationship'         => $d->relation ?? $d->emp_relation ?? optional($d->dependent)->emp_relation ?? '',
                    'Gender'               => $d->gender ?? optional($d->dependent)->gender ?? optional($d->employee)->gender ?? '',
                    'DOB'                  => (string)($d->dob ?? ''),
                    'Phone'                => $d->phone ?? '',
                    'Email'                => $d->email ?? '',
                    'Department'           => $d->department ?? '',
                    'Designation'          => $d->designation ?? '',
                    'Health Package ID'    => $d->health_package_id ?? '',
                    'Health Package Name'  => $d->health_package_name ?? '',
                    'Appointment Date'     => (string)($d->appointment_date ?? ''),
                    'Slot'                 => $d->appointment_slot ?? $d->slot ?? '',
                    'Appointment Location' => $d->appointment_location ?? '',
                    'Address Line 1'       => $d->address_line_1 ?? '',
                    'Address Line 2'       => $d->address_line_2 ?? '',
                    'City'                 => $d->city ?? '',
                    'State'                => $d->state ?? '',
                    'Pincode'              => $d->pincode ?? '',
                    'Remarks'              => $d->remarks ?? '',
                ];
            })
            ->toArray();

        // Row where details header starts (title + header row comes after master table)
        // View renders:
        //   Row 1 .. (1 + masterRows): master table (plus 1 header row)
        //   Blank spacer row
        //   Title "Booking Details"
        //   Header row (we’ll freeze here)
        $this->detailsHeaderRow = 1 /* header */ + $this->masterRows + 2 /* spacer + title */ + 1 /* this becomes header row index in the sheet context */;

        return view('exports.booking', [
            'master'  => $master,
            'details' => $details,
        ]);
    }

    /**
     * Freeze panes and basic header styling.
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // Bold the very first row if the view includes a title (it does).
                // Our view uses <h3>, which PhpSpreadsheet renders on row 1.
                // We'll still attempt to bold row 1 and the details header row.
                try {
                    // Freeze: top portion until the details header row (so details data scrolls)
                    // +1 because PhpSpreadsheet is 1-indexed.
                    $freezeRow = $this->detailsHeaderRow + 1;
                    $sheet->freezePane("A{$freezeRow}");

                    // Try to bold the details header row
                    $sheet->getStyle("A{$this->detailsHeaderRow}:Z{$this->detailsHeaderRow}")
                          ->getFont()->setBold(true);
                } catch (\Throwable $e) {
                    // Non-fatal
                    Log::warning('AfterSheet styling warning', ['msg' => $e->getMessage()]);
                }
            },
        ];
    }
}
