<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the logged-in user's profile.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

       return Inertia::render('BrandSelfAppointment/FrontendUserDashboard/Profile', [
    'user' => $user,
]);

    }

    /**
     * Update the user's profile information (frontend).
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'nullable|string|max:20',
        ]);

        $user = $request->user();
        $user->update($validated);

        return redirect()->back()->with('success', 'Profile updated successfully.');
    }
}
