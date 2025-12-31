<?php

namespace App\Http\Controllers;

use App\Models\Employees;
use App\Models\Dependents;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EmployeeController extends Controller
{
    public function submitData(Request $request)
    {
        $validated = Validator::make($request->all(), [
            'company_email' => 'nullable|email',
            'company_password' => 'nullable|string',
            'office_location' => 'nullable|string',
            'appointment_date' => 'nullable|date',
            'appointment_time' => 'nullable|string',
            'employees' => 'required|array',
            'employees.*.name' => 'required|string',
            'employees.*.email' => 'nullable|email',
            'employees.*.conditions' => 'array',
            'employees.*.dependents' => 'nullable|array',
            'agreed' => 'required|boolean',
            'captcha' => 'nullable|string'
        ])->validate();

        foreach ($request->employees as $empData) {
            $employee = Employees::create([
                'company_email' => $request->company_email,
                'company_password' => $request->company_password,
                'office_location' => $request->office_location,
                'appointment_date' => $request->appointment_date,
                'appointment_time' => $request->appointment_time,
                'employee_id' => $empData['id'] ?? null,
                'name' => $empData['name'],
                'designation' => $empData['designation'] ?? null,
                'age' => $empData['age'] ?? null,
                'gender' => $empData['gender'] ?? null,
                'email' => $empData['email'] ?? null,
                'phone' => $empData['phone'] ?? null,
                'conditions' => $empData['conditions'] ?? [],
                'other_condition' => $empData['other_condition'] ?? '',
                'has_dependents' => $empData['has_dependents'] ?? false,
                'agreed' => $request->agreed,
                'captcha' => $request->captcha,
            ]);

            if (!empty($empData['dependents']) && is_array($empData['dependents'])) {
                foreach ($empData['dependents'] as $depData) {
                    $employee->dependents()->create([
                        'name' => $depData['name'],
                        'age' => $depData['age'] ?? null,
                        'gender' => $depData['gender'] ?? null,
                        'phone' => $depData['phone'] ?? null,
                        'email' => $depData['email'] ?? null,
                        'relation' => $depData['relation'] ?? null,
                        'conditions' => $depData['conditions'] ?? [],
                        'other_condition' => $depData['other_condition'] ?? '',
                    ]);
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Employee and dependent data submitted successfully.'
        ]);
    }
}
