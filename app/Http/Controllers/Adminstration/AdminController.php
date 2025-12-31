<?php

namespace App\Http\Controllers\Adminstration;

use App\Models\User;
use App\Models\UserAddress;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Admin\BaseController;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AdminController extends Controller
{
   public function index()
    {
        $id = Auth::id();
        $user = User::with('address')->findOrFail($id);

        return Inertia::render('Adminstration/Profile/Profile', [
            'user' => $user
        ]);
    }

   public function edit($id)
    {
        $admin = User::findOrFail($id);
        $adminusers = UserAddress::where('user_id', $id)->first();

        return response()->json([
            'admin' => $admin,
            'adminusers' => $adminusers
        ]);
    }

   public function update(Request $request, $id)
    {
        $request->validate([
            'admin_name' => 'required|string|max:255',
            'password' => 'nullable|string|min:6',
            'address_1' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'district' => 'nullable|string|max:255',
            'pin' => 'nullable|string|max:20',
        ]);

        $admin = User::findOrFail($id);
        $admin->name = $request->admin_name;
        // $admin->phone = $request->phone;

        if ($request->filled('password')) {
            $admin->password = Hash::make($request->password);
        }

        $admin->save();

        UserAddress::updateOrCreate(
            ['user_id' => $id],
            [
                'address_1' => $request->address_1,
                'state' => $request->state,
                'district' => $request->district,
                'postal_code' => $request->pin,
            ]
        );

        return back()->with('update', 'Profile updated successfully');
    }



}
