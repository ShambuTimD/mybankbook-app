<?php

namespace App\Http\Controllers\Administration;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Settings\AppSettings;

class AppSettingsController extends Controller
{
    /* ------------------- MAIN SETTINGS PAGE ------------------- */
    public function index(AppSettings $settings)
    {
        return Inertia::render('Settings/AppSettings', [
            'settings' => [
                'application_name'         => $settings->application_name,
                'application_short_title'  => $settings->application_short_title,
                'application_version'      => $settings->application_version,
                'company_name'             => $settings->company_name,
                'company_short_name'       => $settings->company_short_name,
                'application_short_logo'   => $settings->application_short_logo,
                'application_big_logo'     => $settings->application_big_logo,
                'application_favicon'      => $settings->application_favicon,
                'business_pmt_link'        => $settings->business_pmt_link,
                'business_pmt_qr'          => $settings->business_pmt_qr,
                'booking_open_offset_days'  => $settings->booking_open_offset_days,
            ]
        ]);
    }

    /* ------------------- UPDATE MAIN SETTINGS ------------------- */
    public function update(Request $request, AppSettings $settings)
    {
        $data = $request->validate([
            'application_name'         => 'required|string|max:255',
            'application_short_title'  => 'nullable|string|max:100',
            'application_version'      => 'nullable|string|max:50',
            'company_name'             => 'required|string|max:255',
            'company_short_name'       => 'nullable|string|max:100',
            'application_short_logo'   => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'application_big_logo'     => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'application_favicon'      => 'nullable|image|mimes:jpg,jpeg,png,ico|max:1024',
            'business_pmt_link'        => 'nullable|string|max:255',
            'business_pmt_qr'          => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'booking_open_offset_days'  => 'required|numeric|min:0|max:30',
        ]);

        // 🔹 Reusable function to handle file upload
        $uploadFile = function ($file, $prefix) {
            $filename = time() . '_' . $prefix . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/settings/appsettings/' . $prefix), $filename);
            return '/uploads/settings/appsettings/' . $prefix . '/' . $filename;
        };

        // ✅ Handle uploads using the reusable function
        if ($request->hasFile('application_short_logo')) {
            $data['application_short_logo'] = $uploadFile($request->file('application_short_logo'), 'short_logo');
        }
        if ($request->hasFile('application_big_logo')) {
            $data['application_big_logo'] = $uploadFile($request->file('application_big_logo'), 'big_logo');
        }
        if ($request->hasFile('application_favicon')) {
            $data['application_favicon'] = $uploadFile($request->file('application_favicon'), 'favicon');
        }
        if ($request->hasFile('business_pmt_qr')) {
            $data['business_pmt_qr'] = $uploadFile($request->file('business_pmt_qr'), 'pmt_qr');
        }

        // ✅ Assign values
        $settings->application_name         = $data['application_name'];
        $settings->application_short_title  = $data['application_short_title'] ?? $settings->application_short_title;
        $settings->application_version      = $data['application_version'] ?? $settings->application_version;
        $settings->company_name             = $data['company_name'];
        $settings->company_short_name       = $data['company_short_name'] ?? $settings->company_short_name;
        $settings->application_short_logo   = $data['application_short_logo'] ?? $settings->application_short_logo;
        $settings->application_big_logo     = $data['application_big_logo'] ?? $settings->application_big_logo;
        $settings->application_favicon      = $data['application_favicon'] ?? $settings->application_favicon;
        $settings->business_pmt_link        = $data['business_pmt_link'] ?? $settings->business_pmt_link;
        $settings->business_pmt_qr          = $data['business_pmt_qr'] ?? $settings->business_pmt_qr;
        $settings->booking_open_offset_days = $data['booking_open_offset_days'];

        // ✅ Save all
        $settings->save();

        return back()->with('success', 'Application settings updated successfully.');
    }


    /* ------------------- PREVIEW SETTINGS (JSON) ------------------- */
    public function list(AppSettings $settings)
    {
        return response()->json([
            'success' => true,
            'data'    => $settings->toArray(),
        ]);
    }

    /* ------------------- SHOW SINGLE VIEW (OPTIONAL) ------------------- */
    public function show()
    {
        return redirect()->route('appsettings.index');
    }

    /* ------------------- DELETE / RESET LOGOS ------------------- */
    public function resetLogos(AppSettings $settings)
    {
        $settings->application_short_logo = '/default/logo.png';
        $settings->application_big_logo   = '/default/logo.png';
        $settings->application_favicon    = '/default/favicon.png';
        $settings->save();

        return back()->with('success', 'Logos reset to default.');
    }
}
