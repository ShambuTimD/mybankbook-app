<?php

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // adjust if you want auth checks here
    }

    public function rules(): array
    {
        return [
            'company_id'       => ['required', 'integer', 'exists:timd_hpbms_companies,id'],
            'office_id'        => ['required', 'integer', 'exists:timd_hpbms_comp_offices,id'],
            'company_user_id'  => ['nullable', 'integer', 'exists:timd_hpbms_comp_users,id'],

            'booking_mode'     => ['nullable', 'string', 'max:50'],
            'pref_appointment_date' => ['nullable', 'date'],
            'notes'            => ['nullable', 'string'],

            'employees'        => ['required', 'array', 'min:1'],

            'employees.*.name'     => ['required', 'string', 'max:255'],
            'employees.*.email'    => ['nullable', 'email', 'max:255'],
            'employees.*.phone'    => ['nullable', 'string', 'max:20'],
            'employees.*.gender'   => ['nullable', Rule::in(['Male', 'Female', 'Other', 'male', 'female', 'other'])],
            'employees.*.dob'      => ['nullable', 'date'],
            'employees.*.age'      => ['nullable', 'integer', 'min:0', 'max:120'],
            'employees.*.designation' => ['nullable', 'string', 'max:100'],
            'employees.*.medical_conditions' => ['nullable', 'array'],
            'employees.*.medical_conditions.*' => ['nullable', 'string'],
            'employees.*.remarks' => ['nullable', 'string'],

            'employees.*.dependents' => ['nullable', 'array'],
            'employees.*.dependents.*.name' => ['required_with:employees.*.dependents', 'string', 'max:255'],
            // 'employees.*.dependents.*.emp_relation' => ['required_with:employees.*.dependents', 'string', 'max:100'],
            'employees.*.dependents.*.emp_relation' => ['nullable', 'string', 'max:100'], 
            'employees.*.dependents.*.gender' => ['nullable', Rule::in(['Male', 'Female', 'Other', 'male', 'female', 'other'])],
            'employees.*.dependents.*.age' => ['nullable', 'integer', 'min:0', 'max:120'],
            'employees.*.dependents.*.email' => ['nullable', 'email', 'max:255'],
            'employees.*.dependents.*.phone' => ['nullable', 'string', 'max:20'],
            'employees.*.dependents.*.medical_conditions' => ['nullable', 'array'],
            'employees.*.dependents.*.medical_conditions.*' => ['nullable', 'string'],
            'employees.*.dependents.*.remarks' => ['nullable', 'string'],

            'user_agent'       => ['nullable', 'string'],
            'user_ip'          => ['nullable', 'ip'],
            'client_session_id'=> ['nullable', 'string', 'max:100'],
            'brn'              => ['nullable', 'string', 'max:100'],
            'status'           => ['nullable', 'string', 'max:50'],
            'dos'              => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'company_id.required' => 'Please select a company.',
            'office_id.required' => 'Please select an office.',
            'employees.required' => 'At least one employee must be provided.',
            'employees.*.name.required' => 'Employee name is required.',
            'employees.*.dependents.*.name.required_with' => 'Dependent name is required when adding dependents.',
        ];
    }
}
